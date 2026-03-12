const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { redis } = require('../config/redis');

// Single-device: token stored in Redis, new login invalidates old
const TOKEN_KEY_PREFIX = 'user:token:';

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: 'Unauthorized', data: null });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const tokenKey = TOKEN_KEY_PREFIX + decoded.userId;
    const stored = await redis.get(tokenKey);
    if (stored !== token) {
      return res.status(401).json({ code: 401, msg: 'Token invalid or expired (single device)', data: null });
    }
    req.userId = decoded.userId;
    req.user = { id: decoded.userId };
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: 'Invalid token', data: null });
  }
}

module.exports = { auth, TOKEN_KEY_PREFIX };
