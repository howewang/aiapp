const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatService = require('../modules/chat/chat.service');
const { pool } = require('../config/db');
const { success, fail } = require('../utils/response');
const { logError } = require('../utils/logger');

async function history(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) return fail(res, 'sessionId 必填');
  const userId = req.userId;
  try {
    const r = await pool.query(
      `SELECT user_a, user_b FROM chat_sessions WHERE id = $1 AND (user_a = $2 OR user_b = $2)`,
      [sessionId, userId]
    );
    if (r.rows.length === 0) return fail(res, '会话不存在或已过期', 404);
    const messages = await chatService.getMessages(sessionId);
    const transformed = messages.map(m => ({
      id: m.senderId + m.time,
      role: m.senderId === userId ? 'me' : 'them',
      text: m.text,
      time: m.time,
      status: 'read',
    }));
    return success(res, transformed);
  } catch (err) {
    logError({ module: 'chat', message: err?.message, stack: err?.stack, userId, requestId: req.requestId });
    return fail(res, '获取历史失败');
  }
}

router.get('/history', auth, history);

module.exports = router;
