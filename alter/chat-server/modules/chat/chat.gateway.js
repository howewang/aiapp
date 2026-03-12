const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { redis } = require('../../config/redis');
const chatService = require('./chat.service');
const matchService = require('../match/match.service');
const { pool } = require('../../config/db');
const { TOKEN_KEY_PREFIX } = require('../../middleware/auth');
const { logChatEvent, logError } = require('../../utils/logger');

const clients = new Map();

function getUserIdFromToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded.userId;
  } catch {
    return null;
  }
}

async function validateToken(userId, token) {
  const stored = await redis.get(TOKEN_KEY_PREFIX + userId);
  return stored === token;
}

function sendToUser(userId, payload) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function getSessionOtherUser(sessionId, userId) {
  const r = await pool.query(
    `SELECT user_a, user_b FROM chat_sessions WHERE id = $1 AND status = 'active'`,
    [sessionId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return row.user_a === userId ? row.user_b : row.user_a;
}

function setupChatGateway(server, app) {
  const wss = new WebSocket.Server({ server, path: '/chat' });
  app.locals.sendToUser = sendToUser;

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || url.searchParams.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      ws.close(4001, 'Invalid token');
      return;
    }

    const valid = await validateToken(userId, token);
    if (!valid) {
      ws.close(4001, 'Token invalid or expired');
      return;
    }

    const existing = clients.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close(4002, 'Single device: new login');
    }
    clients.set(userId, ws);
    ws.userId = userId;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'chat') {
          const { sessionId, text } = msg;
          if (!sessionId || !text || typeof text !== 'string') return;
          const otherId = await getSessionOtherUser(sessionId, userId);
          if (!otherId) return;
          await chatService.pushMessage(sessionId, userId, text);
          await matchService.updateLastMessage(userId, otherId, text);
          await matchService.updateLastMessage(otherId, userId, text);
          logChatEvent({ event: 'message_sent', sessionId, sender: userId });
          const payload = {
            type: 'chat',
            sessionId,
            senderId: userId,
            text,
            time: new Date().toISOString(),
          };
          sendToUser(otherId, { ...payload, role: 'them' });
          sendToUser(userId, { ...payload, role: 'me' });
        }
      } catch (err) {
        logError({ module: 'chat', message: err?.message, stack: err?.stack, userId });
      }
    });

    ws.on('close', () => {
      if (clients.get(userId) === ws) {
        clients.delete(userId);
      }
    });

    ws.on('error', () => {
      if (clients.get(userId) === ws) {
        clients.delete(userId);
      }
    });
  });

  return wss;
}

module.exports = { setupChatGateway, sendToUser, clients };
