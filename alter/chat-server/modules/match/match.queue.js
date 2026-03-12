const { redis } = require('../../config/redis');

const QUEUE_PREFIX = 'match:queue:';
const QUEUE_TTL = 120; // seconds - user stays in queue max 2 min, then we can expand

function queueKey(personality) {
  return QUEUE_PREFIX + personality;
}

async function addToQueue(personality, userId) {
  const key = queueKey(personality);
  const data = JSON.stringify({ userId, timestamp: Date.now() });
  await redis.lpush(key, data);
  await redis.expire(key, QUEUE_TTL);
}

async function popFromQueue(personality) {
  const key = queueKey(personality);
  const raw = await redis.rpop(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function removeFromQueue(personality, userId) {
  const key = queueKey(personality);
  const items = await redis.lrange(key, 0, -1);
  for (const item of items) {
    try {
      const parsed = JSON.parse(item);
      if (parsed.userId === userId) {
        await redis.lrem(key, 1, item);
        return;
      }
    } catch (_) {}
  }
}

async function getQueueLength(personality) {
  return redis.llen(queueKey(personality));
}

module.exports = {
  addToQueue,
  popFromQueue,
  removeFromQueue,
  getQueueLength,
};
