# Nexus

A unified knowledge platform that ingests saved content from multiple sources, extracts and distills core insights using AI, and organizes them into a dynamic, self-evolving taxonomy. Search your knowledge base with AI-powered synthesis and citations.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         nexus-platform-web (React + Vite)       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / REST + SSE
┌────────────────────▼────────────────────────────┐
│       nexus-platform-core (Spring Boot)         │
│  Auth, API, Data Access, Job Orchestration, SSE │
└──────┬─────────────────────────┬────────────────┘
       │ Redis Streams           │ HTTP /internal/
       │ (async jobs)            │ (sync search)
┌──────▼─────────────────────────▼────────────────┐
│      nexus-platform-worker (TypeScript)         │
│  Extraction, Distillation, Embeddings, Search   │
└─────────────────────────────────────────────────┘
       │                    │
   PostgreSQL           Redis
   (pgvector)
```

| Service | Stack | Purpose |
|---------|-------|---------|
| `nexus-platform-web` | React, Vite, TypeScript, Tailwind, shadcn/ui | Frontend SPA |
| `nexus-platform-core` | Spring Boot, Java 21, Maven | API gateway, auth, orchestration |
| `nexus-platform-worker` | TypeScript, Node.js | AI processing, search, embeddings |

## Prerequisites

- **Java 21+** (for nexus-platform-core)
- **bun** (for nexus-platform-web and nexus-platform-worker)
- **Docker + Docker Compose** (for PostgreSQL and Redis)

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> && cd nexus

# 2. Set up environment variables
cp .env.example .env
# Fill in your API keys (Google OAuth, Twitter, Anthropic, Cohere, Firecrawl)

# 3. Install root dependencies (Husky pre-commit hooks)
bun install

# 4. Start infrastructure
bun run dev:infra

# 5. Start the backend (in a separate terminal)
bun run dev:core

# 6. Start the frontend (in a separate terminal)
bun run dev:web

# 7. Start the worker (in a separate terminal)
bun run dev:worker
```

The frontend will be available at `http://localhost:5180`.

## Project Structure

```
nexus/
├── nexus-platform-core/     # Spring Boot backend (Java)
├── nexus-platform-web/      # React frontend (TypeScript)
├── nexus-platform-worker/   # AI worker (TypeScript)
├── docker-compose.yml       # PostgreSQL + Redis for local dev
├── .env.example             # Environment variables template
├── .editorconfig            # Consistent formatting across IDEs
├── package.json             # Root scripts + Husky/lint-staged
└── .husky/                  # Git pre-commit hooks
```

## Available Scripts

Run these from the repo root:

| Script | Command | Description |
|--------|---------|-------------|
| `bun run dev:web` | Vite dev server | Start frontend on :5180 |
| `bun run dev:core` | `./mvnw spring-boot:run` | Start backend on :8085 |
| `bun run dev:worker` | Node.js worker | Start AI worker on :3005 |
| `bun run dev:infra` | `docker compose up -d` | Start PostgreSQL + Redis |
| `bun run dev:infra:down` | `docker compose down` | Stop infrastructure |
| `bun run build:web` | Vite build | Production build of frontend |
| `bun run build:core` | `./mvnw clean package` | Build backend JAR |
| `bun run test:core` | `./mvnw test` | Run backend tests |
| `bun run lint:web` | ESLint | Lint frontend code |
| `bun run lint:worker` | ESLint | Lint worker code |

## Environment Variables

See [`.env.example`](.env.example) for all required variables. Key groups:

| Group | Variables | Notes |
|-------|-----------|-------|
| PostgreSQL | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Defaults work with docker-compose |
| Redis | `REDIS_HOST`, `REDIS_PORT` | Defaults work with docker-compose |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) |
| Twitter OAuth | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` | [Twitter Developer Portal](https://developer.twitter.com/) |
| JWT | `JWT_SECRET` | Change in production |
| Anthropic | `ANTHROPIC_API_KEY` | For Claude API (distillation, search) |
| Cohere | `COHERE_API_KEY` | For embeddings |
| Firecrawl | `FIRECRAWL_API_KEY` | For web content extraction |

## Contributing

- **Pre-commit hooks** run automatically via Husky — ESLint + Prettier on staged `.ts/.tsx` files
- **EditorConfig** ensures consistent indentation and line endings across IDEs
- **Java code** uses 4-space indentation; **TypeScript** uses 2-space
- Run `bun run lint:web` or `bun run lint:worker` to check code style manually
