const { redis } = require('../../config/redis');
const config = require('../../config/config');

const KEY_PREFIX = 'chat:session:';

function key(sessionId) {
  return KEY_PREFIX + sessionId;
}

async function pushMessage(sessionId, senderId, text) {
  const k = key(sessionId);
  const msg = JSON.stringify({ senderId, text, time: new Date().toISOString() });
  await redis.lpush(k, msg);
  await redis.expire(k, config.chatTtlSeconds);
}

async function getMessages(sessionId) {
  const k = key(sessionId);
  const raw = await redis.lrange(k, 0, -1);
  return raw.map(r => {
    try {
      return JSON.parse(r);
    } catch {
      return null;
    }
  }).filter(Boolean).reverse();
}

module.exports = { pushMessage, getMessages };
