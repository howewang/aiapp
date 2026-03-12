const personalityService = require('./personality.service');
const { success, fail } = require('../../utils/response');

async function list(req, res) {
  try {
    const items = await personalityService.list();
    return success(res, items);
  } catch (err) {
    console.error('personality list error:', err);
    return fail(res, '获取人格列表失败');
  }
}

async function checkSession(req, res) {
  try {
    const data = await personalityService.checkTodaySession(req.userId);
    return success(res, data);
  } catch (err) {
    console.error('checkSession error:', err);
    return fail(res, '获取会话状态失败');
  }
}

async function use(req, res) {
  const { personality_type } = req.body;
  if (!personality_type) return fail(res, 'personality_type 必填');
  try {
    const unlocked = await personalityService.isUnlocked(req.userId, personality_type);
    if (!unlocked) return fail(res, '请先解锁该人格', 403);
    const data = await personalityService.selectPersonality(req.userId, personality_type);
    return success(res, data);
  } catch (err) {
    console.error('selectPersonality error:', err);
    return fail(res, '选择人格失败');
  }
}

async function unlock(req, res) {
  const { personality_type } = req.body;
  if (!personality_type) return fail(res, 'personality_type 必填');
  try {
    await personalityService.unlock(req.userId, personality_type);
    return success(res, { success: true });
  } catch (err) {
    console.error('unlock error:', err);
    return fail(res, '解锁失败');
  }
}

async function rate(req, res) {
  const { target_user_id, personality_type, rating } = req.body;
  if (!target_user_id || !personality_type || rating == null) {
    return fail(res, '缺少必填字段');
  }
  try {
    await personalityService.ratePersonality(req.userId, target_user_id, personality_type, rating);
    return success(res, { success: true });
  } catch (err) {
    console.error('ratePersonality error:', err);
    return fail(res, '评分失败');
  }
}

module.exports = { list, checkSession, use, unlock, rate };
