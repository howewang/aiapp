-- 1. users (phone + password, single device)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid VARCHAR(36) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL DEFAULT '神秘旅人',
  avatar VARCHAR(500) DEFAULT '',
  gender VARCHAR(10) DEFAULT '',
  coin INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. personality_types (seed from StrangerVibes)
CREATE TABLE IF NOT EXISTS personality_types (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE
);

-- 3. daily_sessions (today's personality selection, 3AM CST reset)
CREATE TABLE IF NOT EXISTS daily_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality_type VARCHAR(50) NOT NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- 4. personality_stats (usage count, ratings per user per personality)
CREATE TABLE IF NOT EXISTS personality_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality_type VARCHAR(50) NOT NULL,
  usage_count INT DEFAULT 0,
  total_rating DECIMAL(10,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, personality_type)
);

-- 5. user_unlocked_personalities (premium unlock)
CREATE TABLE IF NOT EXISTS user_unlocked_personalities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, personality_type)
);

-- 6. chat_sessions (active chat, 3hr TTL)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  user_a UUID NOT NULL REFERENCES users(id),
  user_b UUID NOT NULL REFERENCES users(id),
  personality_a VARCHAR(50) NOT NULL,
  personality_b VARCHAR(50) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  expire_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_users ON chat_sessions(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expire ON chat_sessions(expire_time) WHERE status = 'active';

-- 7. daily_matches (today's chat list for App)
CREATE TABLE IF NOT EXISTS daily_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES users(id),
  session_date DATE NOT NULL,
  user_personality VARCHAR(50) NOT NULL,
  matched_personality VARCHAR(50) NOT NULL,
  matched_nickname VARCHAR(100) DEFAULT '神秘旅人',
  matched_avatar VARCHAR(500) DEFAULT '',
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_matches_user_date ON daily_matches(user_id, session_date);

-- 8. chat_history_users (aggregate stats)
CREATE TABLE IF NOT EXISTS chat_history_users (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  chat_count INT DEFAULT 0,
  last_chat_time TIMESTAMPTZ,
  UNIQUE(user_id, target_user_id)
);

-- 9. reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  session_id INT REFERENCES chat_sessions(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. products (for personality unlock)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  personality_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  price_cents INT DEFAULT 0
);

-- 11. orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id INT REFERENCES products(id),
  status VARCHAR(20) DEFAULT 'pending',
  amount_cents INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. user_stats (match_count, chat_count, etc.)
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  match_count INT DEFAULT 0,
  chat_count INT DEFAULT 0,
  total_chat_time INT DEFAULT 0,
  report_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
