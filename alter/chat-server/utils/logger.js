/**
 * Structured logging with Pino.
 * Log types: api_access, error, match_event, chat_event, security_event, payment_event
 */
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV !== 'production';
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

const opts = {
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'chat-server' },
  timestamp: pino.stdTimeFunctions.isoTime,
};

let baseLogger;
if (isDev) {
  opts.transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } };
  baseLogger = pino(opts);
} else {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const stream = pino.multistream([
      { stream: process.stdout },
      { stream: pino.destination(path.join(logDir, 'app.log')), level: 'info' },
    ]);
    baseLogger = pino(opts, stream);
  } catch {
    baseLogger = pino(opts);
  }
}

/**
 * Request-scoped context for userId, sessionId, requestId
 */
function createChildLogger(base = {}) {
  return baseLogger.child(base);
}

/**
 * Access log: API request
 */
function logAccess(data) {
  baseLogger.info({
    type: 'api_access',
    ...data,
  });
}

/**
 * Error log
 */
function logError(data) {
  baseLogger.error({
    type: 'error',
    ...data,
  });
}

/**
 * Match event log
 */
function logMatch(data) {
  baseLogger.info({
    type: 'match_event',
    ...data,
  });
}

/**
 * Chat event log (NO message content)
 */
function logChatEvent(data) {
  baseLogger.info({
    type: 'chat_event',
    ...data,
  });
}

/**
 * Security log (report, ban, etc.)
 */
function logSecurity(data) {
  baseLogger.info({
    type: 'security_event',
    ...data,
  });
}

/**
 * Payment log
 */
function logPayment(data) {
  baseLogger.info({
    type: 'payment_event',
    ...data,
  });
}

module.exports = {
  logger: baseLogger,
  createChildLogger,
  logAccess,
  logError,
  logMatch,
  logChatEvent,
  logSecurity,
  logPayment,
};
