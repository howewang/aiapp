const matchService = require('./match.service');
const matchQueue = require('./match.queue');
const { success, fail } = require('../../utils/response');
const { logMatch, logError } = require('../../utils/logger');

async function start(req, res) {
  const userId = req.userId;
  try {
    const personality = await matchService.getTodayPersonality(userId);
    if (!personality) {
      return fail(res, '请先选择今日人格', 400);
    }
    const sendToUser = req.app.locals.sendToUser || (() => {});
    const result = await matchService.tryPair(userId, personality, (uid, payload) => {
      sendToUser(uid, payload);
    });
    if (result.status === 'queued') {
      return success(res, { status: 'queued', message: '等待匹配中' });
    }
    return success(res, { status: 'matched', sessionId: result.sessionId, matchedUser: result.matchedUser });
  } catch (err) {
    logError({ module: 'match', message: err?.message, stack: err?.stack, userId });
    return fail(res, '匹配失败');
  }
}

async function cancel(req, res) {
  const userId = req.userId;
  try {
    const personality = await matchService.getTodayPersonality(userId);
    if (personality) {
      await matchQueue.removeFromQueue(personality, userId);
    }
    return success(res, { success: true });
  } catch (err) {
    logError({ module: 'match', message: err?.message, stack: err?.stack, userId });
    return fail(res, '取消失败');
  }
}

async function today(req, res) {
  try {
    const matches = await matchService.getTodayMatches(req.userId);
    return success(res, { matches });
  } catch (err) {
    logError({ module: 'match', message: err?.message, stack: err?.stack, userId: req.userId });
    return fail(res, '获取今日匹配失败');
  }
}

async function record(req, res) {
  const { matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message } = req.body;
  if (!matched_user_id || !user_personality || !matched_personality) {
    return fail(res, '缺少必填字段');
  }
  try {
    const result = await matchService.recordMatch(req.userId, {
      matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message,
    });
    return success(res, result);
  } catch (err) {
    logError({ module: 'match', message: err?.message, stack: err?.stack, userId: req.userId });
    return fail(res, '记录匹配失败');
  }
}

module.exports = { start, cancel, today, record };
