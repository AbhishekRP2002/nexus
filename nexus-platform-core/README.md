# nexus-platform-core

Spring Boot (Java 21) backend for Nexus. Handles auth, API routing, data access, job orchestration, and SSE events.

## Tech Stack

- Java 21 + Spring Boot 3
- PostgreSQL 16 with pgvector extension
- Redis (job queues via Redisson)
- Flyway (database migrations)
- Maven (`./mvnw` wrapper included)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java | 21+ | Use [Eclipse Temurin](https://adoptium.net/) or any JDK 21 |
| Docker + Docker Compose | Latest | Runs PostgreSQL + Redis locally |
| Maven | — | Not needed — use `./mvnw` wrapper in this repo |

---

## 1. Start Infrastructure

From the **repo root** (`nexus/`):

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (db: `nexus`, user: `nexus`, password: `nexus`)
- **Redis** on `localhost:6379`

---

## 2. Configure Local Environment

```bash
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
```

Then edit `application-local.yml` and fill in:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: YOUR_GOOGLE_CLIENT_ID      # from Google Cloud Console
            client-secret: YOUR_GOOGLE_CLIENT_SECRET
```

> **Getting Google OAuth credentials:**
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
> 2. Create an **OAuth 2.0 Client ID** (type: Web application)
> 3. Add `http://localhost:8080/login/oauth2/code/google` as an Authorized Redirect URI
> 4. Copy Client ID and Client Secret into `application-local.yml`

The `application-local.yml` file is gitignored — never commit it.

---

## 3. Run the Backend

**Option A — IntelliJ IDEA (recommended):**
1. Open the project in IntelliJ
2. Go to **Run → Edit Configurations**
3. Add VM option: `-Dspring.profiles.active=local`
4. Run `NexusApplication`

**Option B — Terminal:**

```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=local"
```

Backend starts on **http://localhost:8080**

---

## 4. Verify It's Working

```bash
# Should return AUTH_001 (correct — not logged in)
curl http://localhost:8080/api/auth/me

# Swagger UI — explore all endpoints
open http://localhost:8080/swagger-ui.html

# Trigger Google OAuth login (opens browser)
open http://localhost:8080/oauth2/authorization/google
```

Flyway runs migrations automatically on startup — the `users` table and pgvector extension are created for you.

---

## 5. Available Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/oauth2/authorization/google` | Public | Start Google OAuth login |
| `GET` | `/api/auth/me` | JWT cookie | Get current user profile |
| `POST` | `/api/auth/logout` | JWT cookie | Logout and invalidate token |
| `GET` | `/swagger-ui.html` | Public | API docs |
| `GET` | `/v3/api-docs` | Public | OpenAPI JSON spec |

---

## 6. Build & Test

```bash
# Run tests
./mvnw test

# Build JAR (skip tests)
./mvnw clean package -DskipTests

# Check code style (Checkstyle)
./mvnw checkstyle:check
```

---

## 7. Database Migrations

Flyway runs automatically on startup. Migration files live in:

```
src/main/resources/db/migration/
  V1__init_users.sql    ← users table + pgvector extensions
```

> ⚠️ **Never edit an existing migration file** after it has been applied to any database.
> Always create a new file (`V2__...sql`) for schema changes.

If you see a Flyway checksum mismatch error (e.g. you edited V1 locally), run:

```bash
docker exec nexus-postgres psql -U nexus -d nexus \
  -c "UPDATE flyway_schema_history SET checksum = <new_checksum> WHERE version = '1';"
```

---

## Project Structure

```
src/main/java/com/nexus/
├── NexusApplication.java          Entry point
├── auth/
│   ├── config/
│   │   ├── SecurityConfig.java    Spring Security, OAuth2, JWT filter chain
│   │   └── JwtAuthFilter.java     Reads JWT from HTTP-only cookie per request
│   ├── controller/
│   │   └── AuthController.java    GET /api/auth/me, POST /api/auth/logout
│   ├── dto/
│   │   └── AuthUserDTO.java       Safe user projection (no tokens exposed)
│   ├── entity/
│   │   └── User.java              JPA entity mapped to users table
│   ├── repository/
│   │   └── UserRepository.java    JPA repository
│   └── service/
│       ├── GoogleOAuthService.java Find-or-create user from Google OAuth
│       └── JwtService.java        Issue + validate JWTs
└── shared/
    ├── config/
    │   └── AppConfig.java         CORS, beans
    ├── dto/
    │   └── APIResponse.java       Standard { success, data, error } wrapper
    └── exception/
        ├── ErrorCode.java         Typed error codes with HTTP status
        ├── NexusException.java    Base business exception
        └── GlobalExceptionHandler.java  @RestControllerAdvice error handler
```
