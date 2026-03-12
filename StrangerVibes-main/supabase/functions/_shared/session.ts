/**
 * Returns the current "session date" with a 3 AM CST (UTC+8) daily reset.
 * Before 03:00 CST  → yesterday's date
 * After  03:00 CST  → today's date
 */
export function getSessionDate(): string {
  const now = new Date();
  // Shift to UTC+8
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hours = cst.getUTCHours();
  // Before 3 AM → use previous day
  if (hours < 3) {
    cst.setUTCDate(cst.getUTCDate() - 1);
  }
  return cst.toISOString().split('T')[0]; // YYYY-MM-DD
}
