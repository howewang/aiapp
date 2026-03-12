require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionDateOffsetHours: 3, // 3 AM CST reset
  chatTtlSeconds: 10800, // 3 hours
  matchExpandSeconds: 30,
};
