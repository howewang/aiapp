ALTER TABLE daily_matches ADD COLUMN IF NOT EXISTS chat_session_id INT REFERENCES chat_sessions(id);
