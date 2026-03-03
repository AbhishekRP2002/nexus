-- ============================================================
-- V1 — Initial schema: extensions + users table
-- Flyway runs this automatically on first startup.
-- ============================================================

-- pgvector extension (needed for content embeddings later)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity (from Google OAuth)
    email               VARCHAR(255)    NOT NULL UNIQUE,
    display_name        VARCHAR(255),
    avatar_url          TEXT,
    google_id           VARCHAR(255)    NOT NULL UNIQUE,

    -- Session security
    -- Incremented on logout/password-change equivalent (revoke all JWTs)
    token_version       INTEGER         NOT NULL DEFAULT 0,

    -- Twitter OAuth (Phase 2)
    -- Stored as AES-256/GCM encrypted JSON: base64(iv):base64(ciphertext+authTag)
    -- Format: { accessToken, refreshToken, expiresAt }
    twitter_connected   BOOLEAN         NOT NULL DEFAULT FALSE,
    twitter_tokens      TEXT,

    -- Account state
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,

    -- User preferences (theme, notification settings etc.)
    preferences         JSONB           NOT NULL DEFAULT '{}',

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Auth lookups (hit on every JWT validation)
CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_google_id ON users (google_id);
-- Active user filter (most queries should exclude inactive users)
CREATE INDEX idx_users_is_active ON users (is_active) WHERE is_active = TRUE;

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
