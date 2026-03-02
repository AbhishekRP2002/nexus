# ─── Stage 1: Build ──────────────────────────────────────────────────────────
# Uses Maven + JDK 21 to compile and package the fat JAR.
# The target/ folder is NOT copied to the final image.
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom first — Docker caches this layer if pom.xml hasn't changed,
# so dependency downloads are skipped on subsequent builds.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build (skip tests — tests run in CI, not in Docker build)
COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
# Minimal JRE image — no Maven, no source code, no build tools.
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Don't run as root
RUN addgroup -S nexus && adduser -S nexus -G nexus
USER nexus

# Copy only the fat JAR from the build stage
COPY --from=builder /app/target/nexus-platform-core-*.jar app.jar

# Expose backend port
EXPOSE 8080

# Activate prod profile — application-prod.yml values injected via env vars at runtime
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
