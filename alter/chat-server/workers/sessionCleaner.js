require('dotenv').config();
const { pool } = require('../config/db');
const { logChatEvent, logError } = require('../utils/logger');

const EARLY_LEAVE_THRESHOLD_SEC = 60;

async function run() {
  const r = await pool.query(
    `UPDATE chat_sessions SET status = 'expired' WHERE status = 'active' AND expire_time < NOW() RETURNING id, user_a, user_b, start_time`
  );
  for (const row of r.rows || []) {
    const duration = row.start_time ? Math.round((Date.now() - new Date(row.start_time).getTime()) / 1000) : 0;
    logChatEvent({ event: 'session_end', sessionId: row.id, duration, userA: row.user_a, userB: row.user_b });
    if (duration < EARLY_LEAVE_THRESHOLD_SEC) {
      logChatEvent({ event: 'early_leave', sessionId: row.id, duration });
    }
  }
}

async function loop() {
  try {
    await run();
  } catch (err) {
    logError({ module: 'sessionCleaner', message: err?.message, stack: err?.stack });
  }
  setTimeout(loop, 60 * 1000);
}

loop();
