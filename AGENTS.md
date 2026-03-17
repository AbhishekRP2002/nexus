# AGENTS.md

Nexus is a unified knowledge platform that ingests saved content (Twitter bookmarks, web pages, LinkedIn posts), distills key insights using AI, organizes them into a dynamic taxonomy, and provides AI-powered search with citations. Think of it as a personal knowledge base that grows smarter with every saved piece of content.

## Core principles

### 1. Think before coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity first
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

**The test:** Would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

### 4. Goal-driven execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

| Instead of... | Transform to... |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

## Architecture overview

This is a **two-service backend** (not microservices) with a React SPA frontend:

| Service | Stack | Purpose |
|---|---|---|
| `nexus-platform-web` | Vite 7 + React 19 + Tailwind CSS 4 + shadcn/ui | SPA frontend — Feed, Knowledge Map, Reader, AI Search |
| `nexus-platform-core` | Spring Boot 3 (Java 21) | Platform backbone — auth, REST API, data access, job orchestration |
| `nexus-platform-worker` | TypeScript (Node.js) + Hono | AI/content intelligence — extraction, distillation, embeddings, AI search synthesis |

**Why the split:** AI/content SDKs (Firecrawl, Anthropic, LangChain, OpenAI) are TypeScript-first. Spring Boot excels at auth, transactions, and data access. Each service uses the ecosystem where it is strongest.

**Communication:** Spring Boot enqueues jobs to Redis for most of the services. The TS worker consumes them, writes results to PostgreSQL, and pushes completion events back to Redis. No synchronous REST calls between backend services.

**Shared infra:** PostgreSQL 16 + pgvector (with the thought of single DB for both services)/ qdrant (self contained vector db), Redis 7 (cache + job queues).


## Code style

### TypeScript (web + worker)
- Strict mode, ES modules (`"type": "module"`)
- Bun as the package manager and runtime
- Use `tsx` for dev (watch mode), `tsc` for production builds
- Zod for runtime validation, Zod-OpenAPI for API schemas (worker)
- Pino for structured logging (worker)

### Java (core)
- Java 21+, Spring Boot 3.x
- Spring Data JPA + Hibernate for data access
- Flyway for database migrations (run on startup — `src/main/resources/db/migration/`)
- Checkstyle enforced on commit

### React (web)
- React 19 with React Router v7
- shadcn/ui + Radix UI for components
- Tailwind CSS 4 (OKLCH color space)
- Tiptap for rich text editing (Knowledge Map chapters)
- TanStack Query for server state

## Repository structure

### Root

The repo is a Bun workspace monorepo. The root `package.json` defines workspaces and shared dev scripts (`dev:*`, `build:*`, `test:*`, `lint:*`). Infrastructure config lives here too.

| File | Purpose |
|---|---|
| `docker-compose.yml` | Full production stack — postgres (pgvector:pg16), redis (7-alpine), core, worker, web (nginx). All services have health checks. |
| `.env.example` | Every required env var with descriptions. Copy to `.env` before first run. |
| `eslint.config.js` | Shared flat ESLint config — typescript-eslint recommended + Prettier for both web and worker. |
| `engineering_implementation.md` | **The source of truth.** Comprehensive product spec, data models (7 PostgreSQL tables), API contracts, user journeys, and architecture decisions. Read this first for any non-trivial feature work. |

### `nexus-platform-web/` — React SPA Frontend

The user-facing application. Vite 7 dev server on `:5180`, production build served via Nginx.

- **`src/components/`** — Reusable UI components built with shadcn/ui + Radix UI primitives. Tailwind CSS 4 with OKLCH color space for theming.
- **`src/pages/`** — Route-level page components. React Router v7 handles navigation.
- **`src/hooks/`** — Custom hooks including TanStack Query hooks for server state management (queries + mutations).
- **`src/lib/`** — Utility functions, API client setup, shared constants.
- **`src/types/`** — TypeScript type definitions shared across the frontend.

Key patterns: TanStack Query for all server state (no Redux/Zustand). Tiptap for rich text editing in Knowledge Map chapters. `sessionStorage` for search result caching.

### `nexus-platform-core/` — Spring Boot API

The platform backbone. Runs on `:8080`. Owns the database schema (Flyway migrations), authentication, and all REST endpoints the frontend consumes.

Each feature is a self-contained package under `src/main/java/com/nexus/`:

| Package | What it does |
|---|---|
| `auth/` | Google + Twitter OAuth2 login, JWT token issuance/validation, Spring Security filter chain. Entry point for all authenticated requests. |
| `ingestion/` | Accepts URL submissions from users, triggers Twitter bookmark sync. Creates `ContentItem` records in PENDING state and enqueues extraction jobs to Redis. |
| `content/` | CRUD operations on content items. Manages the state machine (PENDING → READY). Serves the Feed and Reader views. |
| `taxonomy/` | Category and topic management. Serves the Knowledge Map tree structure. Categories are AI-generated during the ORGANIZING pipeline stage but user-editable. |
| `search/` | Hybrid search — combines pgvector semantic similarity with PostgreSQL full-text search via Reciprocal Rank Fusion (RRF). Returns ranked results to the frontend; delegates AI synthesis to the worker. |
| `orchestration/` | Redis job queue interface. Enqueues jobs (extraction, distillation, organization, embedding) and listens for completion events. This is the only module that communicates with the worker. |
| `shared/` | JPA entities, global exception handling, base config, cross-cutting concerns. All feature packages depend on this; it depends on none of them. |

Flyway migrations live in `src/main/resources/db/migration/`. Spring Boot runs them automatically on startup. The worker never creates or modifies tables — it only reads/writes rows.

### `nexus-platform-worker/` — TypeScript AI Worker

The AI intelligence layer. Hono HTTP server on `:3005` for direct API calls (AI search synthesis), plus a Redis queue consumer for async pipeline jobs.

**`src/domains/`** — Feature-specific business logic:

| Domain | What it does |
|---|---|
| `ingestion/` | The content pipeline. Consumes Redis jobs and executes: web scraping (Firecrawl) → content distillation (LLM summarization, key insights, tags) → taxonomy organization (AI-generated categories) → vector embedding (OpenAI embeddings → Qdrant). Each stage writes results to PostgreSQL before advancing. |
| `search/` | AI-powered answer synthesis. Receives search queries via Hono routes, retrieves relevant content chunks from Qdrant, and uses an LLM to generate cited answers grounded in the user's saved content. |

**`src/shared/`** — Infrastructure and cross-cutting concerns:

| Directory | What it does |
|---|---|
| `clients/` | Database client (postgres.js — lightweight, no ORM) and Redis client (ioredis). Both are singleton instances initialized from Zod-validated env config. |
| `providers/` | LLM and embedding provider abstraction. Supports OpenAI, Anthropic, and OpenRouter via LangChain. Swappable at runtime via `LLM_PROVIDER` env var. |
| `vectorstore/` | Qdrant vector store client. Handles upserting embeddings during ingestion and similarity search during AI search. |
| `scraping/` | Firecrawl integration for web content extraction. Converts arbitrary URLs into clean markdown text suitable for LLM processing. |
| `middleware/` | Hono middleware — error handling, rate limiting, request logging (Pino). |

**`src/config/`** — Zod schemas that validate all environment variables at startup. If any required var is missing, the worker fails fast with a clear error.

**`src/types/`** — Shared TypeScript interfaces and type definitions (content item shapes, job payloads, API response types).

### `docs/` — Documentation

| File | What it covers |
|---|---|
| `architecture.md` | System topology, service boundaries, cross-service communication, queue architecture, content pipeline, AI search flow, data model (all 7 tables), inter-service rules, queue engineering practices. |
| `technical_decisions.md` | Every significant technical choice with rationale and tradeoffs — two-service split, Redis over BullMQ, Qdrant over pgvector, LangChain over LangGraph, tech stack rationale, current build state, and what's not built yet. |

These two files are the source of truth for architecture and decisions. Update them when making significant changes.

## Important context

- Feature modules are self-contained packages. Cross-feature communication happens through injected service interfaces, never through direct DB access across feature boundaries.
