# Architecture

## System Overview

Nexus is a two-service backend with a React SPA frontend. This is **not microservices** — it is a deliberate split based on ecosystem boundaries. If the boundary ever proves wrong, merging is trivial.

```
Frontend (React SPA)
    ↓ HTTP
Spring Boot (Platform backbone)
    ↓ Redis queues (LPUSH/BRPOP)
TypeScript Worker (AI/content intelligence)
    ↓ Direct writes
PostgreSQL (shared database)
```

## Deployment Topology

| Unit | What | Dev Port | Prod Port |
|---|---|---|---|
| Frontend | Vite + React SPA. Client-side routing, API calls to Spring Boot. | 5180 | 3000 (Nginx) |
| Spring Boot API | Platform backbone: auth, REST API, data access, job orchestration. The service the frontend talks to. | 8080 | 8080 |
| TypeScript Worker | Hono HTTP server (search) + Redis queue consumer (ingestion). Reads jobs from Redis, writes results to PostgreSQL. | 3005 | 3005 |
| PostgreSQL | pgvector-enabled. Single DB shared by both services. | 5435 | 5432 |
| Redis | Cache + job queues. | 6382 | 6379 |
| Qdrant | Managed cloud vector database for semantic search. | — | — |

In production, Nginx serves the static React build and proxies `/api/search` → worker:3005 and `/api` → core:8080. Handles SPA routing with `try_files $uri /index.html`.

## Service Boundaries

### Spring Boot API — What It Owns

- **Auth**: Google OAuth 2.0, Twitter OAuth 2.0 PKCE, JWT issuance (HTTP-only cookie `nexus_token`, 24h expiry, HS256), Spring Security filter chain, token version revocation.
- **Ingestion**: URL submission endpoint, Twitter bookmark polling (@Scheduled every 30min via Twitter API v2), deduplication (exact URL + content hash), batch import. Creates `content_items` rows in PENDING state and enqueues extraction jobs to Redis.
- **Content CRUD**: Content item state machine (PENDING → READY), reader view data, highlights, notes.
- **Taxonomy CRUD**: Reading/writing taxonomy nodes, user overrides (move, rename, merge, split), category browsing API.
- **Search orchestration**: Receives search queries from frontend, runs pgvector/full-text hybrid retrieval, enqueues AI Answer jobs to worker, returns ranked results immediately.
- **Job orchestration**: Enqueues extraction/distillation/taxonomy jobs to Redis via Redisson, listens for completion events, updates content status.
- **API layer**: All REST endpoints the frontend consumes, rate limiting, user-scoped data access.

### TypeScript Worker — What It Owns

- **Content extraction**: Firecrawl SDK for URL → Markdown conversion, Jina Reader API fallback, Twitter API v2 for tweet/thread content + thread unrolling, recursive outbound link following.
- **Knowledge distillation**: Claude API structured prompts for key insights (3-5), structured synopsis (What/Why/How), named entity extraction (tech/person/concept/company), one-line summary.
- **Embedding generation**: OpenAI `text-embedding-3-small` (1536-dim) via LangChain. Both content embeddings and search query embeddings.
- **AI Answer synthesis**: Takes retrieved content from hybrid search, calls Claude to generate a synthesized answer with inline `[N]` citations + follow-up questions. SSE streaming with word-by-word delta delivery.
- **Taxonomy intelligence**: Computes embedding similarity against cluster centroids for category placement, calls Claude for cluster label generation, auto-split when cluster exceeds threshold (~15 items).
- **Duplicate detection**: Cosine similarity computation against existing embeddings to flag near-duplicates (>0.95 similarity).

## Cross-Service Communication

The two backend services communicate exclusively through Redis queues and a shared PostgreSQL database. No synchronous REST calls between them.

### Job Types

| Job Type | Enqueued By | Processed By | Input | Output (written to PG) |
|---|---|---|---|---|
| `extract_content` | Spring Boot (on URL submission or Twitter sync) | Worker | URL, source type, content item ID | Extracted Markdown, title, metadata. Status → EXTRACTED |
| `distill_content` | Worker (after extraction completes) | Worker | Content item ID, extracted text | Key insights, synopsis, entities, embedding vector. Status → DISTILLED |
| `place_taxonomy` | Worker (after distillation completes) | Worker | Content item ID, embedding | Taxonomy node assignment(s) with confidence scores. Status → ORGANIZED |
| `generate_ai_answer` | Spring Boot (on search query) | Worker | Query text, retrieved content IDs | Synthesized answer text, citation mappings. Written to Redis for immediate return. |
| `reeval_taxonomy` | Spring Boot (@Scheduled periodic job) | Worker | User ID, all content embeddings | Cluster analysis, split/merge recommendations, new labels. |

The worker chains extraction → distillation → taxonomy placement internally by self-enqueuing the next stage. Spring Boot only enqueues the initial extraction job and listens for the final completion event.

### Queue Architecture (LPUSH/BRPOP)

```
Producer (Spring Boot / Redisson):
  LPUSH nexus:queue:content-ingestion '{"jobId":"abc","contentItemId":"..."}'
  ↓
  Redis List: [job3] [job2] [job1]  ← LPUSH adds to the LEFT (head)
                                ↑
Consumer (Worker / ioredis):     BRPOP takes from the RIGHT (tail)
  BRPOP nexus:queue:content-ingestion 5
  → Returns job1 (oldest first = FIFO)
```

BRPOP (blocking pop) holds the connection open server-side without consuming CPU. The 5-second timeout is a "check if we should shut down" interval — during those 5 seconds, the connection is idle. As soon as a job arrives, BRPOP returns immediately.

### Job Payload

```json
{
  "jobId": "uuid",
  "contentItemId": "uuid",
  "userId": "uuid",
  "sourceUrl": "https://example.com/article",
  "sourceType": "web",
  "step": "extract",
  "attempt": 1,
  "createdAt": 1710590400000
}
```

- `jobId`: Unique per job instance (for deduplication and logging)
- `contentItemId`: FK to `content_items` table (for status updates)
- `attempt`: Incremented on retry (consumer tracks this, not Redis)
- `step`: Which pipeline stage to start from (enables partial retries)

## Content Processing Pipeline

### State Machine

```
PENDING → EXTRACTING → EXTRACTED → DISTILLING → DISTILLED → ORGANIZING → ORGANIZED → READY
   ↓           ↓            ↓           ↓            ↓           ↓
 FAILED      FAILED       FAILED     FAILED       FAILED      FAILED
```

- Each transition is persisted to PostgreSQL immediately
- On failure: retry up to 3 times with exponential backoff, then FAILED + dead letter queue
- Status is queryable by the frontend to show processing progress

### Pipeline Trace

1. **Spring Boot**: Ingestion receives a URL (user submission) or detects a new Twitter bookmark (@Scheduled poll). Deduplicates, creates content item (PENDING), enqueues `extract_content` to Redis.
2. **Worker**: Picks up extraction job. Calls Firecrawl (or Jina fallback, or Twitter API for tweets). Writes clean Markdown + metadata to PostgreSQL. Status → EXTRACTED. Self-enqueues `distill_content`.
3. **Worker**: Generates embedding (OpenAI), calls Claude for key insights, synopsis, entities. Checks for near-duplicates via cosine similarity. Writes results to PostgreSQL. Status → DISTILLED. Self-enqueues `place_taxonomy`.
4. **Worker**: Computes similarity to existing cluster centroids, assigns categories. Writes taxonomy mappings. Status → ORGANIZED. Pushes completion event to Redis.
5. **Spring Boot**: Receives completion event. Updates status to READY. Content appears in Feed and Knowledge Map.

Total wall-clock time: 15-45 seconds per item. Items process in parallel when multiple are queued.

### Pipeline Resilience

Each stage writes its output to PostgreSQL before enqueuing the next stage. If distillation fails, extracted content is preserved. If taxonomy placement fails, distilled insights are still available. The user sees progressively richer content as each stage completes.

## AI Search Flow

1. User submits a natural language query.
2. Spring Boot receives the query, enqueues an `embed_query` job to Redis.
3. Worker generates a 1536-dim query embedding (OpenAI).
4. Spring Boot runs hybrid retrieval: pgvector cosine similarity (top 20) + PostgreSQL full-text search (top 20) + Reciprocal Rank Fusion (RRF) merge → top 8.
5. Spring Boot enqueues `generate_ai_answer` with top 8 content IDs. Returns ranked results immediately (~200ms).
6. Worker reads the 8 items' distilled data from PostgreSQL, calls Claude with a synthesis prompt (cite sources using `[N]` notation).
7. AI Answer streams to frontend via SSE (2-4 seconds).

### SSE Streaming Protocol

Endpoint: `GET /api/search/stream?q={query}&userId={userId}`

| Event | Payload | Purpose |
|---|---|---|
| `status` | `{"phase": "retrieving"}` | Loading state |
| `sources` | `{"results": [...]}` | Populate Results tab immediately |
| `answer-delta` | `{"delta": "text chunk"}` | Stream AI answer token-by-token |
| `citations` | `{"citations": {"1": {...}}}` | Map citation numbers to sources |
| `follow-up` | `{"questions": [...]}` | Clickable follow-up chips |
| `done` | `{}` | Close SSE connection |

## Data Model

Seven tables in PostgreSQL 16 with pgvector extension. All IDs are UUIDs (`gen_random_uuid()`). All tables have `created_at` / `updated_at` TIMESTAMPTZ columns. Flyway migrations run on Spring Boot startup.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `google_id` | VARCHAR(128) UNIQUE NOT NULL | Google OAuth `sub` claim |
| `email` | VARCHAR(255) UNIQUE NOT NULL | From Google ID token |
| `display_name` | VARCHAR(255) NOT NULL | From Google ID token |
| `avatar_url` | TEXT | Google profile pic URL |
| `twitter_connected` | BOOLEAN DEFAULT FALSE | |
| `twitter_access_token` | TEXT | AES-256 encrypted |
| `twitter_refresh_token` | TEXT | AES-256 encrypted |
| `twitter_token_expires_at` | TIMESTAMPTZ | For auto-refresh before expiry |
| `twitter_user_id` | VARCHAR(64) | Twitter platform user ID |
| `twitter_last_sync_at` | TIMESTAMPTZ | Last bookmark sync timestamp |
| `preferences` | JSONB DEFAULT '{}' | Theme, notification prefs, etc. |

### `content_items`

Core entity — every saved piece of content (tweet, article, LinkedIn post).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users ON DELETE CASCADE | |
| `source_type` | VARCHAR(20) CHECK ('twitter','web','linkedin') | |
| `source_url` | TEXT NOT NULL | Original URL |
| `platform_id` | VARCHAR(128) | Tweet ID, LinkedIn post ID |
| `title` | TEXT NOT NULL | |
| `author` | VARCHAR(255) | |
| `author_handle` | VARCHAR(128) | @handle |
| `published_at` | TIMESTAMPTZ | Original publish date |
| `body_markdown` | TEXT | Full extracted content (Markdown) |
| `synopsis` | JSONB | `{ "what": "...", "why": "...", "how": "..." }` |
| `key_insights` | JSONB DEFAULT '[]' | JSON array of strings |
| `entities` | JSONB DEFAULT '[]' | `[{ "name": "...", "type": "tech|person|concept|company" }]` |
| `tags` | JSONB DEFAULT '[]' | AI-generated topic tags |
| `metadata` | JSONB DEFAULT '{}' | Source-specific (thread count, word count, etc.) |
| `embedding` | vector(1536) | pgvector column for semantic search |
| `content_hash` | VARCHAR(64) | SHA-256 of body for deduplication |
| `status` | VARCHAR(20) DEFAULT 'PENDING' | State machine: PENDING → ... → READY | FAILED |
| `error_message` | TEXT | Last failure reason |
| `retry_count` | INTEGER DEFAULT 0 | For exponential backoff |
| `is_viewed` | BOOLEAN DEFAULT FALSE | |
| `is_archived` | BOOLEAN DEFAULT FALSE | |
| `user_notes` | TEXT | User's personal notes |
| `saved_at` | TIMESTAMPTZ DEFAULT NOW() | When user saved the content |

Indexes: `(user_id, saved_at DESC)` for feed pagination, `(user_id, source_url)` UNIQUE for dedup, `(user_id, status)` for pipeline filtering, HNSW on `embedding vector_cosine_ops` for semantic search, GIN on `to_tsvector('english', title || ' ' || COALESCE(body_markdown, ''))` for full-text search.

### `taxonomy_nodes`

Self-referential hierarchical tree. Each user has their own taxonomy. A taxonomy node doubles as a "chapter" in the Living Book (Knowledge Map).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users ON DELETE CASCADE | |
| `parent_id` | UUID FK → taxonomy_nodes ON DELETE CASCADE | NULL = root node |
| `label` | VARCHAR(255) NOT NULL | e.g. "LLM Inference" |
| `description` | TEXT | AI-generated category description |
| `depth` | INTEGER DEFAULT 0 | 0 = root, 1 = child, 2 = grandchild... |
| `sort_order` | INTEGER DEFAULT 0 | Sibling ordering within parent |
| `item_count` | INTEGER DEFAULT 0 | Denormalized content count |
| `embedding_centroid` | vector(1536) | Mean of child content embeddings |
| `creation_method` | VARCHAR(10) DEFAULT 'auto' | 'auto' (AI-created) or 'manual' (user-created) |
| `last_reorg_at` | TIMESTAMPTZ | Last AI re-organization timestamp |

Indexes: `(user_id, parent_id)` for tree traversal, `(user_id, depth)` for root listing, HNSW on `embedding_centroid vector_cosine_ops` for taxonomy placement.

### `content_taxonomy`

Many-to-many join: content items <> taxonomy nodes with AI confidence scores.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `content_id` | UUID FK → content_items ON DELETE CASCADE | |
| `taxonomy_node_id` | UUID FK → taxonomy_nodes ON DELETE CASCADE | |
| `confidence` | DECIMAL(4,3) DEFAULT 1.0 | AI placement confidence (0-1) |
| `is_primary` | BOOLEAN DEFAULT TRUE | Primary category shown in UI |
| `assignment_method` | VARCHAR(10) DEFAULT 'auto' | 'auto' or 'manual' |

Unique constraint: `(content_id, taxonomy_node_id)`.

### `knowledge_links`

Cross-content relationships discovered during distillation.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `source_content_id` | UUID FK → content_items ON DELETE CASCADE | |
| `target_content_id` | UUID FK → content_items ON DELETE CASCADE | |
| `link_type` | VARCHAR(20) CHECK ('related','duplicate','references','contradicts') | |
| `strength` | DECIMAL(4,3) | Cosine similarity or LLM-assigned confidence (0-1) |
| `creation_method` | VARCHAR(10) DEFAULT 'auto' | 'auto' or 'manual' |

Unique constraint: `(source_content_id, target_content_id, link_type)`.

### `chapter_sections`

Living Book chapter content. Each taxonomy node can have multiple sections. No separate `chapters` table — a chapter IS a taxonomy node + its `chapter_sections` rows.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `taxonomy_node_id` | UUID FK → taxonomy_nodes ON DELETE CASCADE | |
| `section_type` | VARCHAR(20) CHECK ('overview','techniques','lessons','entities','subchapters') | |
| `title` | VARCHAR(255) NOT NULL | Display title (e.g. "Key Techniques") |
| `content` | TEXT DEFAULT '' | HTML string for Tiptap rich text editor |
| `entities` | JSONB | For section_type='entities' only |
| `sort_order` | INTEGER DEFAULT 0 | Section ordering within the chapter |
| `is_ai_generated` | BOOLEAN DEFAULT TRUE | FALSE when user edits |
| `last_generated_at` | TIMESTAMPTZ | Last AI generation timestamp |

Index: `(taxonomy_node_id, sort_order)`.

### `search_history`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users ON DELETE CASCADE | |
| `query` | TEXT NOT NULL | |
| `result_count` | INTEGER | |

Index: `(user_id, created_at DESC)`.

### Entity Relationships

```
users 1──N content_items
  │              │
  │              ├──M:N── content_taxonomy ──M:N── taxonomy_nodes
  │              │                                      │
  │              └──M:N── knowledge_links (self-ref)    ├── parent_id (self-ref tree)
  │                                                     │
  ├──N taxonomy_nodes                                   └──1:N── chapter_sections
  │
  └──N search_history
```

## Inter-Service Rules

1. **No synchronous REST calls** between services. All communication flows through Redis queues and the shared PostgreSQL database.
2. **Both services can read from PostgreSQL.** The worker writes AI outputs (extracted text, insights, embeddings, AI answers). Spring Boot writes platform data (users, content status, taxonomy structure, user overrides).
3. **Flyway migrations are owned by Spring Boot** and run on startup. The worker assumes the schema is up-to-date.
4. **Job payloads are minimal** (content item ID + job type). The worker reads full data from PostgreSQL. This avoids large payloads and ensures the worker always operates on the latest state.
5. **The worker is stateless.** It can be horizontally scaled by running multiple instances consuming from the same Redis queue.

## Queue Engineering Practices

### Idempotency
Jobs must be safe to retry. If a job is processed twice (crash during processing), the system produces the same result:
- Qdrant upsert (not insert): re-upserting overwrites, doesn't duplicate
- PostgreSQL status updates: setting `status = 'EXTRACTED'` twice is a no-op
- Embedding regeneration: deterministic for the same input text

### Bounded Retries + Dead Letter Queue
Never retry forever. After MAX_RETRIES (3): set `content_items.status = 'FAILED'`, move job to dead letter queue, log at WARN level.

### Graceful Shutdown
On SIGTERM: stop accepting new jobs → finish current job → close connections → exit. The 5-second BRPOP timeout ensures the consumer checks the shutdown flag every 5 seconds at most.

### Monitoring

| Metric | How to Check | Alert When |
|---|---|---|
| Queue depth | `LLEN nexus:queue:content-ingestion` | > 100 |
| DLQ size | `LLEN nexus:queue:dead-letter` | > 0 |
| Processing time | Log duration per job | > 60s |
| Worker health | `/health` endpoint | Unreachable |
