// Load this first in every entry point. It reads .env and fixes the hospital time zone,
// so slot times, reminders and "today" all use the same clock.
require('dotenv').config({ quiet: true });
process.env.TZ = process.env.TZ || 'Asia/Manila';

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

module.exports = {
  leadDays: int(process.env.BOOKING_LEAD_DAYS, 1),
  windowDays: Math.max(1, int(process.env.BOOKING_WINDOW_DAYS, 14)),
  reminderHours: int(process.env.REMINDER_HOURS, 24),
  notifierSeconds: Math.max(5, int(process.env.NOTIFIER_INTERVAL_SECONDS, 30))
};
