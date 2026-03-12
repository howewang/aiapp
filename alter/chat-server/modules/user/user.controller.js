const userService = require('./user.service');
const { success, fail } = require('../../utils/response');
const { logError } = require('../../utils/logger');

async function register(req, res) {
  const { phone, password, nickname, avatar } = req.body;
  if (!phone || !password) {
    return fail(res, '手机号和密码必填');
  }
  if (phone.length < 11) {
    return fail(res, '请输入有效的手机号');
  }
  if (password.length < 6) {
    return fail(res, '密码至少6位');
  }
  try {
    const existing = await userService.getByPhone(phone);
    if (existing) return fail(res, '该手机号已注册');
    const { user, token } = await userService.register(phone, password, nickname, avatar);
    if (!user || !token) return fail(res, '注册失败');
    await userService.storeToken(user.id, token);
    return success(res, { user, token });
  } catch (err) {
    if (err.code === '23505') return fail(res, '该手机号已注册');
    logError({ module: 'user', message: err?.message, stack: err?.stack });
    return fail(res, '注册失败');
  }
}

async function login(req, res) {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return fail(res, '手机号和密码必填');
  }
  try {
    const result = await userService.login(phone, password);
    if (!result || !result.user || !result.token) return fail(res, '手机号或密码错误');
    await userService.invalidateToken(result.user.id);
    await userService.storeToken(result.user.id, result.token);
    return success(res, { user: result.user, token: result.token });
  } catch (err) {
    logError({ module: 'user', message: err?.message, stack: err?.stack });
    return fail(res, '登录失败');
  }
}

async function info(req, res) {
  try {
    const user = await userService.getById(req.userId);
    if (!user) return fail(res, '用户不存在', 404);
    return success(res, user);
  } catch (err) {
    logError({ module: 'user', message: err?.message, stack: err?.stack, userId: req?.userId });
    return fail(res, '获取用户信息失败');
  }
}

module.exports = { register, login, info };
