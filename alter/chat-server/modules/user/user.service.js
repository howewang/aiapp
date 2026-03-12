const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/db');
const { redis } = require('../../config/redis');
const config = require('../../config/config');
const { TOKEN_KEY_PREFIX } = require('../../middleware/auth');

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

async function register(phone, password, nickname, avatar) {
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  const uuid = id;
  await pool.query(
    `INSERT INTO users (id, uuid, phone, password_hash, nickname, avatar) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, uuid, phone, hash, nickname || `用户${phone.slice(-4)}`, avatar || '']
  );
  const user = await getById(id);
  return { user, token: createToken(id) };
}

async function login(phone, password) {
  const r = await pool.query('SELECT id, password_hash FROM users WHERE phone = $1', [phone]);
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  const token = createToken(row.id);
  await storeToken(row.id, token);
  const user = await getById(row.id);
  return { user, token };
}

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function storeToken(userId, token) {
  const key = TOKEN_KEY_PREFIX + userId;
  await redis.setex(key, TOKEN_TTL_SECONDS, token);
}

async function invalidateToken(userId) {
  await redis.del(TOKEN_KEY_PREFIX + userId);
}

async function getByPhone(phone) {
  const r = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
  return r.rows.length > 0 ? r.rows[0] : null;
}

async function getById(id) {
  const r = await pool.query(
    `SELECT id, uuid, phone, nickname, avatar, gender, coin, created_at FROM users WHERE id = $1`,
    [id]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: row.id,
    uuid: row.uuid,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    gender: row.gender,
    coin: row.coin,
    created_at: row.created_at,
  };
}

module.exports = {
  register,
  login,
  getById,
  getByPhone,
  storeToken,
  invalidateToken,
};
