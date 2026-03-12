const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const reportService = require('../modules/report/report.service');
const { success, fail } = require('../utils/response');
const { logSecurity, logError } = require('../utils/logger');

router.post('/', auth, async (req, res) => {
  const { target_user_id, session_id, reason } = req.body;
  if (!target_user_id) return fail(res, 'target_user_id 必填');
  try {
    await reportService.createReport(req.userId, target_user_id, session_id, reason);
    logSecurity({ event: 'report', reporter: req.userId, target: target_user_id, sessionId: session_id, reason: reason || '' });
    return success(res, { success: true });
  } catch (err) {
    logError({ module: 'report', message: err?.message, stack: err?.stack, userId: req.userId });
    return fail(res, '举报失败');
  }
});

module.exports = router;
