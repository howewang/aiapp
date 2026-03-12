/**
 * Session date with 3 AM CST (UTC+8) daily reset.
 * Before 03:00 CST → yesterday's date
 * After 03:00 CST → today's date
 */
function getSessionDate() {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hours = cst.getUTCHours();
  if (hours < 3) {
    cst.setUTCDate(cst.getUTCDate() - 1);
  }
  return cst.toISOString().split('T')[0];
}

module.exports = { getSessionDate };
