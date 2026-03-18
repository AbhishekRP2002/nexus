# Technical Decisions

This document records key technical decisions, their rationale, and tradeoffs. Update this file when making significant architectural or tooling choices.

---

## Two-Service Split (Spring Boot + TypeScript Worker)

**Decision**: Split the backend into a Spring Boot platform service and a TypeScript AI worker, rather than a monolith or microservices.

**Why**: The AI/content SDK ecosystem is TypeScript-first. Firecrawl, Anthropic, Cohere, and OpenAI all ship first-class TypeScript SDKs that are better maintained and faster to adopt new features than Java counterparts. Meanwhile, Spring Boot's strengths (dependency injection, Spring Security, Spring Data JPA, @Scheduled) are exactly what the platform layer needs. Each service uses the ecosystem where it is strongest.

**Tradeoff**: Two deployment units instead of one. Schema changes must be coordinated (Flyway owns the schema, worker must match column names). Acceptable because both services are in the same repo and share the same DB.

**Reversal cost**: Low. Collapsing two services into one is far easier than splitting one into two.

---

## Raw Redis Lists Over BullMQ

**Decision**: Use plain LPUSH/BRPOP Redis lists for job queues instead of BullMQ.

**Why**: BullMQ is Node.js-only. It uses Redis streams, sorted sets, and hashes — a complex internal schema. Redisson (Java) cannot produce jobs that BullMQ can consume. Raw Redis lists work with any language: Redisson's `RDeque.addFirst()` maps to LPUSH, ioredis's `brpop()` maps to BRPOP.

**Tradeoff**: We lose BullMQ's advanced features (delayed jobs, rate limiting, job dashboard, repeatable jobs). Must implement retry/DLQ manually. Worth it because cross-language compatibility is a hard requirement.

**If both services were TypeScript**, BullMQ would be the obvious choice. The constraint is the Java ↔ TypeScript boundary.

---

## Command-Driven, Not Event Sourcing

**Decision**: Job messages are commands ("process this URL") not events ("URL was saved").

**Why**: There's exactly one consumer behavior per job — the ingestion pipeline. We don't need multiple consumers reacting differently to the same event. Commands are simpler and more explicit.

---

## Worker as HTTP Service (Not Pure Queue Consumer)

**Decision**: The worker exposes REST + SSE endpoints via Hono in addition to consuming Redis queues. Frontend calls worker directly for search (proxied via Vite in dev, Nginx in prod).

**Why**: Eliminated Spring Boot as a middleman for search — reduces latency and complexity. Search is synchronous and real-time, not suited for queue-based async processing.

**The worker has two roles**:
1. HTTP server — serves search requests (Hono)
2. Queue consumer — processes ingestion jobs (BRPOP loop)

Both run in the same process. BRPOP is non-blocking in the Node.js/Bun event loop — it yields while waiting.

---

## Qdrant Over pgvector for Vector Search

**Decision**: Use managed Qdrant cloud instead of pgvector in PostgreSQL for vector search. A `VectorStore` interface allows swapping implementations.

**Why**: Managed service, no self-hosted infra. Qdrant supports both vector similarity and text search in one query, simplifying hybrid search. pgvector can be swapped in later via the interface.

**Note**: pgvector is still used for content item embeddings in PostgreSQL (for hybrid retrieval by Spring Boot). Qdrant is the primary search index.

---

## OpenAI Embeddings Over Cohere

**Decision**: Using `text-embedding-3-small` (1536-dim) via LangChain OpenAIEmbeddings instead of Cohere embed-v3.

**Why**: Simpler — one fewer API key. LangChain-native integration. Swappable via provider abstraction if needed.

---

## LangChain Structured Output Over LangGraph

**Decision**: AI response uses `llm.withStructuredOutput(zodSchema)` instead of a full LangGraph state machine.

**Why**: The retrieve → synthesize → follow-up flow is sequential with no branching. A graph is over-engineering for a linear pipeline. LangGraph can be introduced when reranking or conditional routing is needed.

---

## Nginx Reverse Proxy in Production

**Decision**: In production, Nginx serves the static React build and proxies `/api/search` → worker:3005 and `/api` → core:8080.

**Why**: Single entry point (port 3000), no CORS issues, proper SPA routing on direct URL access/refresh (`try_files $uri /index.html`). Lightweight alternative to running a Node server for static files.

---

## sessionStorage Search Cache

**Decision**: Frontend caches completed search results in `sessionStorage` (5-min TTL, 50 entries). Cached results are restored instantly on back-navigation or page reload without re-running the AI pipeline.

**Why**: Prevents unnecessary LLM API calls and gives instant results on navigation. Uses `sessionStorage` (not `localStorage`) so cache clears when the tab closes.

---

## DEV_BYPASS for Auth

**Decision**: `protected-route.tsx` skips auth checks in development mode via `import.meta.env.DEV`. Search page uses a hardcoded `TEMP_USER_ID = "test-user"`.

**Why**: Allows frontend development without running the Spring Boot OAuth flow.

**Must be removed before production.**

---

## Vite Proxy for Dev

**Decision**: Vite dev server proxies `/api/search` → `localhost:3005` (worker) and `/api` → `localhost:8085` (core).

**Why**: Avoids CORS in development. Mirrors the Nginx proxy topology in production.

---

## Content Extraction: Buy, Don't Build

**Decision**: Delegate all content extraction to third-party services (Firecrawl, Jina Reader, Twitter API).

**Why**: Content extraction is a solved problem with rapidly evolving anti-bot countermeasures. Maintaining custom scrapers is a time sink that doesn't contribute to Nexus's core value proposition. Focus engineering effort on the distillation, taxonomy, and retrieval layers — where the actual differentiation lies.

---

## Shared PostgreSQL (Both Services Write)

**Decision**: Both Spring Boot and the TypeScript worker read/write the same PostgreSQL database directly. The worker writes AI outputs (extracted text, insights, embeddings) directly via postgres.js, not through Spring Boot REST APIs.

**Why**:
1. No circular dependency: worker doesn't need to call Spring Boot APIs
2. Performance: direct DB update is faster than HTTP round-trip
3. Simplicity: one connection, one write — no API contract to maintain
4. Standard for monorepo-style architectures at this scale

**Tradeoff**: Schema changes must be coordinated. Flyway owns the schema; worker must use matching column names.

---

## JSONB for Flexible Structured Data

**Decision**: Use PostgreSQL JSONB columns for synopsis, entities, insights, tags, preferences, and metadata.

**Why**: Queryable without schema changes. These fields have varying shapes across content types and evolve as AI prompts improve. JSONB avoids the need for migration-heavy schema changes every time the distillation output shape changes.

---

## Hybrid Search: Semantic + Lexical via RRF

**Decision**: Combine pgvector cosine similarity (semantic) with PostgreSQL tsvector (lexical) full-text search, merged via Reciprocal Rank Fusion.

**Why**: Semantic search alone misses exact keyword matches. Lexical search alone misses conceptual similarity. RRF is a simple, parameter-free merge algorithm that produces high-quality blended results. Drawn from Perplexity AI architecture patterns.

---

## CASCADE Deletes Throughout

**Decision**: All foreign keys use ON DELETE CASCADE. Deleting a user removes all their content, taxonomy, chapters, links, and search history.

**Why**: All data is user-scoped. Row-level security enforces isolation. There's no scenario where orphaned data is useful — a deleted user's content has no owner.

---

## No Separate Chapters Table

**Decision**: A chapter IS a taxonomy node + its `chapter_sections` rows. No separate `chapters` table.

**Why**: Avoids 1:1 redundancy with taxonomy_nodes. Chapter metadata (title, description, lastUpdated) comes from the taxonomy node itself. The `isParent` flag is derived at query time from whether the node has children.

---

## Technology Stack Rationale

### Frontend

| Component | Choice | Why |
|---|---|---|
| Framework | Vite 7 + React 19 + React Router v7 | Fast builds, HMR, simple SPA. No SSR overhead needed for a private authenticated app. |
| UI Components | shadcn/ui + Radix UI | Accessible, customizable, no vendor lock-in |
| Rich Text | Tiptap | Headless ProseMirror editor for Knowledge Map chapters |
| State | TanStack Query | Server state management and caching. No Redux/Zustand. |
| Styling | Tailwind CSS 4 | Utility-first, OKLCH color space |
| Package Manager | Bun | Fast installs, native TypeScript execution, monorepo workspace support |

### Backend

| Component | Choice | Why |
|---|---|---|
| Language | Java 21 | Virtual threads for high-concurrency async processing |
| Framework | Spring Boot 3.x | Dependency injection, auto-configuration, proven at scale |
| Queue | Redisson + Redis | Distributed queues backed by Redis. BullMQ-like semantics without Node.js dependency. |
| ORM | Spring Data JPA + Hibernate | Mature ORM. pgvector requires custom column types and native queries. |
| Auth | Spring Security OAuth2 Client | Built-in Google OAuth. Custom Twitter OAuth 2.0 PKCE via RestClient. |
| Migrations | Flyway | Version-controlled, runs on startup |

### Worker

| Component | Choice | Why |
|---|---|---|
| Language | TypeScript (Bun) | First-class SDK support for Firecrawl, Anthropic, OpenAI. Async I/O ideal for API-heavy workloads. |
| HTTP | Hono | Lightweight, fast, built-in OpenAPI support |
| LLM | LangChain (Anthropic/OpenAI/OpenRouter) | Model-agnostic, built-in streaming, structured output |
| Extraction | Firecrawl SDK + Jina Reader | URL → clean Markdown. Jina as lightweight fallback. |
| Embeddings | OpenAI text-embedding-3-small (1536-dim) | High quality, LangChain-native |
| Queue | ioredis | BRPOP consumer compatible with Redisson producers |
| DB | postgres.js | Lightweight, no ORM, direct SQL |

---

## LinkedIn Integration Strategy

LinkedIn's API does not expose saved posts for consumer applications.

| Tier | Approach | Risk |
|---|---|---|
| **MVP** | Manual URL submission. Firecrawl extracts the post content. | Zero risk. |
| **Post-MVP** | Authenticated browser automation via Playwright with stealth plugins + proxy rotation (Bright Data). | Low risk with human-like patterns and reasonable frequency. |
| **Scale** | Managed cloud browsers (Browserbase or similar). | Infrastructure cost. |

Manual URL submission is always maintained as a fallback regardless of automation tier.

---

## Current State (March 2026)

### What's Built

- **Frontend**: All views complete (Feed, Knowledge Map with Tiptap, Reader, Search with SSE streaming, Login, Onboarding, Add URL dialog). Search results cached in sessionStorage.
- **Spring Boot**: Auth module complete (Google OAuth, JWT, Spring Security). Flyway V1 migration (users table). Docker config.
- **Worker**: AI search complete (hybrid retrieval, LLM synthesis with structured output, SSE streaming, citations, follow-up questions). Configurable LLM provider. Rate limiting.
- **Infrastructure**: Docker Compose with all services, health checks, named volumes.

### What's Not Built Yet

- Twitter OAuth module and bookmark sync
- Content ingestion pipeline (Redis queue consumer, Firecrawl extraction, LLM distillation)
- Content CRUD and Feed API endpoints
- Taxonomy CRUD and Knowledge Map API endpoints
- Search orchestration through Spring Boot (currently frontend → worker direct)
- TanStack Query integration (frontend currently uses mock data for non-search views)
- End-to-end wiring (frontend → Spring Boot → worker → DB → frontend)
- Production deployment (CI/CD, cloud hosting)
