-- Day Life — PostgreSQL schema (raw SQL, mirrors prisma/schema.prisma)
-- Run this if you are not using `prisma migrate` and want to provision the DB by hand.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'voice');

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(120) NOT NULL,
    approved    BOOLEAN NOT NULL DEFAULT FALSE,
    disabled    BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT phone_format CHECK (phone ~ '^\+?[0-9]{6,20}$')
);

-- ============================================================
-- login_codes  (one-time passwords issued by Admin)
-- ============================================================
CREATE TABLE login_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_codes_user_id ON login_codes(user_id);
CREATE INDEX idx_login_codes_expires_at ON login_codes(expires_at);

-- ============================================================
-- rooms
-- ============================================================
CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- messages
-- ============================================================
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        message_type NOT NULL,
    content     TEXT,
    media_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_or_media CHECK (
        (type = 'text' AND content IS NOT NULL) OR
        (type IN ('image','video','voice') AND media_url IS NOT NULL)
    )
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ============================================================
-- sessions
-- ============================================================
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Seed: default admin (approve/edit phone before first login; no password is stored here —
-- the admin's very first login code must be inserted manually or via a seed script)
-- INSERT INTO users (phone, name, approved, is_admin) VALUES ('+10000000000', 'Admin', TRUE, TRUE);
