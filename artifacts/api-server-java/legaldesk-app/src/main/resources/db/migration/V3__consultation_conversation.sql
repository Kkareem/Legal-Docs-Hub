CREATE TABLE consultation_messages (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'visitor')),
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX consultation_messages_request_order ON consultation_messages(request_id, id);

-- Keep replies already sent before conversation support was introduced.
INSERT INTO consultation_messages(request_id, sender_type, sender_id, body, created_at)
SELECT id, 'staff', responded_by, response, updated_at
FROM consultation_requests WHERE response IS NOT NULL AND btrim(response) <> '';
