-- Earlier demo seed data linked client records to staff accounts; those are not client portal identities.
UPDATE clients SET user_id=NULL WHERE user_id IN (SELECT id FROM users WHERE role <> 'client');
CREATE UNIQUE INDEX clients_user_id_unique ON clients(user_id) WHERE user_id IS NOT NULL;
ALTER TABLE consultation_requests ADD COLUMN client_id BIGINT REFERENCES clients(id);
ALTER TABLE consultation_requests ADD COLUMN case_id BIGINT REFERENCES cases(id);
CREATE TABLE case_updates (
 id BIGSERIAL PRIMARY KEY, case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 title TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL,
 created_by BIGINT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX case_updates_case ON case_updates(case_id,id);
CREATE TABLE portal_files (
 id BIGSERIAL PRIMARY KEY, client_id BIGINT NOT NULL REFERENCES clients(id),
 case_id BIGINT REFERENCES cases(id) ON DELETE CASCADE, payment_id BIGINT REFERENCES payments(id) ON DELETE CASCADE,
 uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
 file_name TEXT NOT NULL, content_type TEXT NOT NULL, file_size BIGINT NOT NULL, content BYTEA NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK ((case_id IS NULL) <> (payment_id IS NULL))
);
CREATE TABLE case_reviews (
 id BIGSERIAL PRIMARY KEY, case_id BIGINT NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
 client_id BIGINT NOT NULL REFERENCES clients(id), lawyer_id BIGINT NOT NULL REFERENCES users(id),
 stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

