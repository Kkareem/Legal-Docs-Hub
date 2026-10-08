CREATE TABLE consultation_assignees (
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, user_id)
);
CREATE INDEX consultation_assignees_user ON consultation_assignees(user_id, request_id);

INSERT INTO consultation_assignees(request_id, user_id)
SELECT id, assigned_to FROM consultation_requests WHERE assigned_to IS NOT NULL;

ALTER TABLE consultation_messages ADD COLUMN sender_name TEXT;
UPDATE consultation_messages m SET sender_name=u.name
FROM users u WHERE m.sender_id=u.id AND m.sender_type='staff';
