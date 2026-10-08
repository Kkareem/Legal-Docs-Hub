ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));
CREATE TABLE consultation_requests (
 id BIGSERIAL PRIMARY KEY,
 tracking_token UUID NOT NULL UNIQUE,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT NOT NULL,
 summary TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 assigned_to BIGINT REFERENCES users(id),
 response TEXT,
 responded_by BIGINT REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE site_visitors (
 visitor_id UUID PRIMARY KEY,
 first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

