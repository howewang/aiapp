const { pool } = require('../../config/db');
const { getSessionDate } = require('../../utils/sessionDate');

async function list() {
  const r = await pool.query('SELECT id, key, name, is_premium FROM personality_types ORDER BY id');
  return r.rows;
}

async function checkTodaySession(userId) {
  const sessionDate = getSessionDate();
  const sessionRow = await pool.query(
    `SELECT personality_type FROM daily_sessions WHERE user_id = $1 AND session_date = $2`,
    [userId, sessionDate]
  );
  const statsRow = await pool.query(
    `SELECT personality_type, usage_count, total_rating, rating_count, last_used_at FROM personality_stats WHERE user_id = $1`,
    [userId]
  );
  const stats = statsRow.rows.map(s => ({
    personality_type: s.personality_type,
    usage_count: parseInt(s.usage_count, 10),
    total_rating: parseFloat(s.total_rating || 0),
    rating_count: parseInt(s.rating_count, 10),
    last_used_at: s.last_used_at ? s.last_used_at.toISOString() : null,
  }));
  return {
    sessionDate,
    hasSelectedToday: sessionRow.rows.length > 0,
    todayPersonality: sessionRow.rows[0]?.personality_type ?? null,
    stats,
  };
}

async function selectPersonality(userId, personalityType) {
  const sessionDate = getSessionDate();
  const existing = await pool.query(
    `SELECT id, personality_type FROM daily_sessions WHERE user_id = $1 AND session_date = $2`,
    [userId, sessionDate]
  );
  if (existing.rows.length > 0) {
    const stats = await getStats(userId);
    return { success: true, alreadySelected: true, stats };
  }

  await pool.query(
    `INSERT INTO daily_sessions (user_id, personality_type, session_date) VALUES ($1, $2, $3)`,
    [userId, personalityType, sessionDate]
  );

  const now = new Date().toISOString();
  const statRow = await pool.query(
    `SELECT id, usage_count FROM personality_stats WHERE user_id = $1 AND personality_type = $2`,
    [userId, personalityType]
  );
  if (statRow.rows.length > 0) {
    await pool.query(
      `UPDATE personality_stats SET usage_count = usage_count + 1, last_used_at = $1 WHERE id = $2`,
      [now, statRow.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO personality_stats (user_id, personality_type, usage_count, first_used_at, last_used_at) VALUES ($1, $2, 1, $3, $3)`,
      [userId, personalityType, now]
    );
  }

  const stats = await getStats(userId);
  return { success: true, alreadySelected: false, stats };
}

async function getStats(userId) {
  const r = await pool.query(
    `SELECT personality_type, usage_count, total_rating, rating_count, last_used_at FROM personality_stats WHERE user_id = $1`,
    [userId]
  );
  return r.rows.map(s => ({
    personality_type: s.personality_type,
    usage_count: parseInt(s.usage_count, 10),
    total_rating: parseFloat(s.total_rating || 0),
    rating_count: parseInt(s.rating_count, 10),
    last_used_at: s.last_used_at ? s.last_used_at.toISOString() : null,
  }));
}

async function isUnlocked(userId, personalityType) {
  const pt = await pool.query(
    `SELECT is_premium FROM personality_types WHERE key = $1`,
    [personalityType]
  );
  if (pt.rows.length === 0 || !pt.rows[0].is_premium) return true;
  const r = await pool.query(
    `SELECT 1 FROM user_unlocked_personalities WHERE user_id = $1 AND personality_type = $2`,
    [userId, personalityType]
  );
  return r.rows.length > 0;
}

async function unlock(userId, personalityType) {
  await pool.query(
    `INSERT INTO user_unlocked_personalities (user_id, personality_type) VALUES ($1, $2) ON CONFLICT (user_id, personality_type) DO NOTHING`,
    [userId, personalityType]
  );
}

async function ratePersonality(raterId, targetUserId, personalityType, rating) {
  const r = await pool.query(
    `SELECT id, total_rating, rating_count FROM personality_stats WHERE user_id = $1 AND personality_type = $2`,
    [targetUserId, personalityType]
  );
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  if (r.rows.length > 0) {
    const row = r.rows[0];
    await pool.query(
      `UPDATE personality_stats SET total_rating = total_rating + $1, rating_count = rating_count + 1 WHERE id = $2`,
      [clamped, row.id]
    );
  } else {
    await pool.query(
      `INSERT INTO personality_stats (user_id, personality_type, usage_count, total_rating, rating_count, first_used_at, last_used_at) VALUES ($1, $2, 0, $3, 1, NOW(), NOW())`,
      [targetUserId, personalityType, clamped]
    );
  }
  return true;
}

module.exports = {
  list,
  checkTodaySession,
  selectPersonality,
  isUnlocked,
  unlock,
  ratePersonality,
};
