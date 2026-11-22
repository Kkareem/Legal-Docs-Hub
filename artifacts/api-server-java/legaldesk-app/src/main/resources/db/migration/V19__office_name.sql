INSERT INTO settings(name,value) VALUES ('office_name',to_jsonb('عبدالرحمن سيد أحمد'::text)) ON CONFLICT(name) DO NOTHING;
