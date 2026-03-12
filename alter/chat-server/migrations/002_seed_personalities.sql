-- Seed personality_types from StrangerVibes theme.ts
INSERT INTO personality_types (key, name, is_premium) VALUES
  ('joyful', '欢脱逗趣型', false),
  ('listener', '慢热倾听型', false),
  ('resonance', '情绪共鸣型', false),
  ('vibe', '氛围烘托表达型', false),
  ('philosopher', '深夜哲思型', false),
  ('blunt', '直言炮筒型', false),
  ('observer', '神秘观察者', true),
  ('rational', '冷静理性型', true),
  ('highenergy', '高能输出型', true),
  ('controller', '氛围掌控型', true),
  ('soul', '灵魂共鸣型', true),
  ('antiroutine', '反套路玩家', true)
ON CONFLICT (key) DO NOTHING;
