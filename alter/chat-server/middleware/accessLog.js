const { v4: uuidv4 } = require('uuid');
const { logAccess } = require('../utils/logger');

const SENSITIVE_KEYS = ['password', 'pass', 'token', 'authorization', 'access_token', 'refresh_token'];

function redactSensitive(obj) {
  if (obj == null) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => (v && typeof v === 'object' ? redactSensitive(v) : v));
  const out = {};
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[key] = '***';
    } else if (obj[key] != null && typeof obj[key] === 'object') {
      out[key] = redactSensitive(obj[key]);
    } else {
      out[key] = obj[key];
    }
  }
  return out;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

function accessLogMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  const start = Date.now();

  const requestParams = {
    query: Object.keys(req.query || {}).length ? req.query : undefined,
    body: req.body && Object.keys(req.body).length ? redactSensitive(req.body) : undefined,
  };

  const origJson = res.json.bind(res);
  res.json = function (payload) {
    res._logPayload = redactSensitive(payload);
    return origJson(payload);
  };

  res.on('finish', () => {
    const latency = Date.now() - start;
    const logPayload = {
      requestId,
      userId: req.userId || null,
      ip: getClientIp(req),
      method: req.method,
      path: req.originalUrl || req.path,
      latency,
      status: res.statusCode,
    };
    if (requestParams.query || requestParams.body) logPayload.requestParams = requestParams;
    if (res._logPayload) logPayload.response = res._logPayload;
    logAccess(logPayload);
  });

  next();
}

module.exports = { accessLogMiddleware };
