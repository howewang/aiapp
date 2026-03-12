const { pool } = require('../../config/db');

async function createReport(reporterId, targetUserId, sessionId, reason) {
  await pool.query(
    `INSERT INTO reports (reporter_id, target_user_id, session_id, reason) VALUES ($1, $2, $3, $4)`,
    [reporterId, targetUserId, sessionId || null, reason || '']
  );
}

module.exports = { createReport };
