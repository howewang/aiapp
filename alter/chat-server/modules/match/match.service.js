const { pool } = require('../../config/db');
const matchQueue = require('./match.queue');
const { getSessionDate } = require('../../utils/sessionDate');
const config = require('../../config/config');
const { logMatch, logChatEvent } = require('../../utils/logger');

const PERSONALITIES = [
  'joyful', 'listener', 'resonance', 'vibe', 'philosopher', 'blunt',
  'observer', 'rational', 'highenergy', 'controller', 'soul', 'antiroutine'
];

const PERSONALITY_NAMES = {
  joyful: '欢脱逗趣型', listener: '慢热倾听型', resonance: '情绪共鸣型',
  vibe: '氛围烘托表达型', philosopher: '深夜哲思型', blunt: '直言炮筒型',
  observer: '神秘观察者', rational: '冷静理性型', highenergy: '高能输出型',
  controller: '氛围掌控型', soul: '灵魂共鸣型', antiroutine: '反套路玩家',
};

async function getTodayPersonality(userId) {
  const sessionDate = getSessionDate();
  const r = await pool.query(
    `SELECT personality_type FROM daily_sessions WHERE user_id = $1 AND session_date = $2`,
    [userId, sessionDate]
  );
  return r.rows[0]?.personality_type || null;
}

async function getUserInfo(userId) {
  const r = await pool.query(
    `SELECT id, nickname, avatar FROM users WHERE id = $1`,
    [userId]
  );
  return r.rows[0] || null;
}

async function getPersonalityRating(userId, personalityType) {
  const r = await pool.query(
    `SELECT total_rating, rating_count FROM personality_stats WHERE user_id = $1 AND personality_type = $2`,
    [userId, personalityType]
  );
  if (!r.rows[0] || r.rows[0].rating_count === 0) return 0;
  const row = r.rows[0];
  return parseFloat((row.total_rating / row.rating_count).toFixed(1));
}

async function tryPair(userId, personality, onMatch) {
  let other = await matchQueue.popFromQueue(personality);
  if (!other || other.userId === userId) {
    await matchQueue.addToQueue(personality, userId);
    return { status: 'queued' };
  }

  const userA = userId;
  const userB = other.userId;

  const expireTime = new Date(Date.now() + config.chatTtlSeconds * 1000);
  const sessionDate = getSessionDate();

  const userAInfo = await getUserInfo(userA);
  const userBInfo = await getUserInfo(userB);
  if (!userAInfo || !userBInfo) {
    await matchQueue.addToQueue(personality, other.userId);
    return { status: 'queued' };
  }

  const ratingB = await getPersonalityRating(userB, personality);
  const ratingA = await getPersonalityRating(userA, personality);
  const personalityB = personality;
  const personalityA = personality;

  const sessionResult = await pool.query(
    `INSERT INTO chat_sessions (user_a, user_b, personality_a, personality_b, expire_time)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userA, userB, personalityA, personalityB, expireTime]
  );
  const sessionId = sessionResult.rows[0].id;

  await pool.query(
    `INSERT INTO daily_matches (user_id, matched_user_id, session_date, user_personality, matched_personality, matched_nickname, matched_avatar, chat_session_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $10), ($2, $1, $3, $5, $4, $8, $9, $10)`,
    [
      userA, userB, sessionDate, personalityA, personalityB,
      userBInfo.nickname, userBInfo.avatar,
      userAInfo.nickname, userAInfo.avatar,
      sessionId
    ]
  );

  const matchPayloadA = {
    type: 'match',
    sessionId,
    matchedUser: {
      id: userBInfo.id,
      nickname: userBInfo.nickname,
      avatar: userBInfo.avatar,
      personality: PERSONALITY_NAMES[personalityB] || personalityB,
      personalityKey: personalityB,
      rating: ratingB,
    },
  };
  const matchPayloadB = {
    type: 'match',
    sessionId,
    matchedUser: {
      id: userAInfo.id,
      nickname: userAInfo.nickname,
      avatar: userAInfo.avatar,
      personality: PERSONALITY_NAMES[personalityA] || personalityA,
      personalityKey: personalityA,
      rating: ratingA,
    },
  };

  await onMatch(userA, matchPayloadA);
  await onMatch(userB, matchPayloadB);

  const waitTime = other.timestamp ? Math.round((Date.now() - other.timestamp) / 1000) : 0;
  logMatch({
    event: 'success',
    userA,
    userB,
    personalityA: personalityA,
    personalityB: personalityB,
    sessionId,
    waitTime,
  });
  logChatEvent({ event: 'session_start', sessionId, userA, userB });

  return { status: 'matched', sessionId, matchedUser: matchPayloadA.matchedUser };
}

async function getTodayMatches(userId) {
  const sessionDate = getSessionDate();
  const r = await pool.query(
    `SELECT id, matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message, last_message_at, created_at, session_date, chat_session_id
     FROM daily_matches WHERE user_id = $1 AND session_date = $2 ORDER BY last_message_at DESC`,
    [userId, sessionDate]
  );
  return r.rows.map(row => ({
    id: row.id,
    chat_session_id: row.chat_session_id,
    matched_user_id: row.matched_user_id,
    user_personality: row.user_personality,
    matched_personality: row.matched_personality,
    matched_nickname: row.matched_nickname,
    matched_avatar: row.matched_avatar,
    last_message: row.last_message || '',
    last_message_at: row.last_message_at?.toISOString() || row.created_at?.toISOString(),
    created_at: row.created_at?.toISOString(),
    session_date: row.session_date,
  }));
}

async function recordMatch(userId, params) {
  const { matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message } = params;
  const sessionDate = getSessionDate();
  const now = new Date().toISOString();

  const existing = await pool.query(
    `SELECT id FROM daily_matches WHERE user_id = $1 AND matched_user_id = $2 AND session_date = $3`,
    [userId, matched_user_id, sessionDate]
  );

  if (existing.rows.length > 0) {
    if (last_message !== undefined) {
      await pool.query(
        `UPDATE daily_matches SET last_message = $1, last_message_at = $2 WHERE id = $3`,
        [last_message, now, existing.rows[0].id]
      );
    }
    return { success: true, matchId: existing.rows[0].id, isNew: false };
  }

  const insert = await pool.query(
    `INSERT INTO daily_matches (user_id, matched_user_id, session_date, user_personality, matched_personality, matched_nickname, matched_avatar, last_message, last_message_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [userId, matched_user_id, sessionDate, user_personality, matched_personality, matched_nickname || '神秘旅人', matched_avatar || '', last_message || '', now]
  );
  return { success: true, matchId: insert.rows[0].id, isNew: true };
}

async function updateLastMessage(userId, matchedUserId, lastMessage) {
  const sessionDate = getSessionDate();
  await pool.query(
    `UPDATE daily_matches SET last_message = $1, last_message_at = NOW() WHERE user_id = $2 AND matched_user_id = $3 AND session_date = $4`,
    [lastMessage, userId, matchedUserId, sessionDate]
  );
}

module.exports = {
  getTodayPersonality,
  tryPair,
  getTodayMatches,
  recordMatch,
  updateLastMessage,
};
