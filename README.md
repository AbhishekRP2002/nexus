# Nexus

A unified knowledge platform that ingests content from multiple sources (Twitter/X, web pages, LinkedIn), extracts and distills core insights using AI, and organizes them into a dynamic, self-evolving taxonomy. Features AI-powered search with RAG synthesis, inline citations, and follow-up question generation.

> **Status:** Early MVP — Authentication, AI-powered search with streaming, and frontend UI are functional. Content ingestion pipeline is next.

## Architecture

![Architecture Diagram](docs/architecture.png)


| Service | Stack | Port | Purpose |
|---|---|---|---|
| `nexus-platform-web` | React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui | 5180 (dev) / 3000 (prod) | Frontend SPA |
| `nexus-platform-core` | Spring Boot 3.4, Java 21, Maven | 8080 | Auth, API gateway, data access |
| `nexus-platform-worker` | Hono, Bun, TypeScript, LangChain | 3005 | AI search, embeddings, LLM synthesis |

## Prerequisites

- **Java 21+** — Spring Boot backend
- **Bun** — Frontend and worker (package management + runtime)
- **Docker + Docker Compose** — PostgreSQL, Redis, and production containers
- **API Keys** — See [Environment Variables](#environment-variables)

## Quick Start

```bash
# 1. Clone and set up environment
git clone <repo-url> && cd nexus
cp .env.example .env
# Fill in required API keys (see Environment Variables section)

# 2. Install dependencies
bun install

# 3. Start infrastructure (PostgreSQL + Redis)
bun run dev:infra

# 4. Start services (each in a separate terminal)
bun run dev:core      # Spring Boot on :8080
bun run dev:worker    # Hono worker on :3005
bun run dev:web       # Vite dev server on :5180
```

Open [http://localhost:5180](http://localhost:5180) to access the application.

### Docker Compose (all services)

```bash
docker compose up -d --build
```

Access the application at [http://localhost:3000](http://localhost:3000). Nginx proxies API requests to the backend services.

## Project Structure

```
nexus/
├── nexus-platform-core/          # Spring Boot backend
│   ├── src/main/java/com/nexus/
│   │   ├── auth/                 #   OAuth2 + JWT authentication
│   │   └── shared/               #   Config, exceptions, DTOs
│   ├── src/main/resources/
│   │   ├── application.yml       #   Spring Boot config
│   │   └── db/migration/         #   Flyway migrations
│   ├── Dockerfile
│   └── pom.xml
│
├── nexus-platform-worker/        # TypeScript AI worker
│   ├── src/
│   │   ├── domains/search/       #   Search routes, hybrid search, AI synthesis
│   │   ├── shared/providers/     #   LLM + embedding provider factories
│   │   ├── shared/vectorstore/   #   Qdrant client + VectorStore interface
│   │   └── shared/middleware/    #   Error handling, rate limiting
│   ├── Dockerfile
│   └── package.json
│
├── nexus-platform-web/           # React frontend
│   ├── src/
│   │   ├── pages/                #   Search, Feed, Map, Reader, Login
│   │   ├── components/           #   Command palette, nav, editor, UI
│   │   ├── lib/                  #   Search API client, types, utils
│   │   └── contexts/             #   Auth + theme providers
│   ├── nginx.conf                #   Production reverse proxy
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.yml            #   All services + infra
├── .env.example                  #   Environment template
└── package.json                  #   Root monorepo config
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Service | Purpose |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | Core | Google OAuth2 login |
| `GOOGLE_CLIENT_SECRET` | Yes | Core | Google OAuth2 login |
| `JWT_SECRET` | Yes | Core | JWT signing key (min 32 chars) |
| `OPENAI_API_KEY` | Yes | Worker | Embeddings + LLM (default provider) |
| `QDRANT_ENDPOINT` | Yes | Worker | Qdrant cloud cluster URL |
| `QDRANT_API_KEY` | Yes | Worker | Qdrant authentication |
| `LLM_PROVIDER` | No | Worker | `openai` (default), `anthropic`, or `openrouter` |
| `ANTHROPIC_API_KEY` | If provider=anthropic | Worker | Claude API |
| `OPENROUTER_API_KEY` | If provider=openrouter | Worker | OpenRouter proxy |
| `POSTGRES_*` | No | Core | Defaults work with docker-compose |

## Available Scripts

From the repository root:

| Script | Description |
|---|---|
| `bun run dev:web` | Start frontend dev server (port 5180) |
| `bun run dev:core` | Start Spring Boot backend (port 8080) |
| `bun run dev:worker` | Start AI worker (port 3005) |
| `bun run dev:infra` | Start PostgreSQL + Redis containers |
| `bun run dev:infra:down` | Stop infrastructure containers |
| `bun run build:web` | Production build of frontend |
| `bun run build:core` | Build backend JAR (skip tests) |
| `bun run test:core` | Run backend integration tests |
| `bun run lint:web` | Lint frontend TypeScript |
| `bun run lint:worker` | Lint worker TypeScript |

## API Endpoints

### Core (Spring Boot) — `:8080`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Current authenticated user |
| `POST` | `/api/auth/logout` | Logout (invalidates JWT) |
| `GET` | `/swagger-ui.html` | OpenAPI documentation |

### Worker (Hono) — `:3005`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/search?q=&userId=` | Ranked search results (hybrid retrieval) |
| `GET` | `/api/search/stream?q=&userId=` | SSE stream: AI-synthesized answer with citations |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |


## Development

- **Pre-commit hooks** — Husky runs ESLint + Prettier on staged `.ts/.tsx` files
- **Java style** — 4-space indentation, Checkstyle enforced
- **TypeScript style** — 2-space indentation, ESLint + Prettier
- **Database migrations** — Flyway (Spring Boot startup). Schema changes go in `db/migration/`

