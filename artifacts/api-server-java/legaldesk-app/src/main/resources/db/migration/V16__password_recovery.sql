CREATE TABLE password_reset_tokens(token_hash TEXT PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 auth_version INTEGER NOT NULL,expires_at TIMESTAMPTZ NOT NULL,used_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE password_reset_limits(scope_hash TEXT PRIMARY KEY,window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),attempts INTEGER NOT NULL DEFAULT 0);
INSERT INTO settings(name,value) VALUES('auth.passwordReset','{"durationMinutes":15}') ON CONFLICT DO NOTHING;
