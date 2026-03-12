/**
 * Unified JSON response format: { code, msg, data }
 */
function success(res, data, msg = 'ok') {
  return res.json({ code: 0, msg, data });
}

function fail(res, msg, code = 1) {
  return res.json({ code, msg, data: null });
}

module.exports = { success, fail };
