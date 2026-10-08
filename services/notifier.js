// The automation loop. Booking and cancelling add rows to the notification table.
// This job wakes up every few seconds, finds rows that are due, sends them, and updates
// their status. Failed sends are retried up to 3 times.
const db = require('../config/db');
const { notifierSeconds } = require('../config/env');
const { dateTimeStr } = require('./time');
const sms = require('./sms');

const MAX_ATTEMPTS = 3;
let running = false;

async function processDue(limit = 50) {
  if (running) return { sent: 0, failed: 0, retried: 0, busy: true };
  running = true;
  const result = { sent: 0, failed: 0, retried: 0 };
  try {
    const [due] = await db.query(
      `SELECT n.notification_ID, n.message, n.attempts, a.contact_phone
         FROM notification AS n
         JOIN appointment  AS a ON a.appointment_ID = n.fk_appointment_ID
        WHERE n.status = 'queued' AND n.send_at <= ?
        ORDER BY n.send_at
        LIMIT ?`,
      [dateTimeStr(new Date()), limit]);

    for (const n of due) {
      try {
        await sms.send({ to: n.contact_phone, message: n.message });
        await db.execute("UPDATE notification SET status='sent', sent_at=?, attempts=attempts+1 WHERE notification_ID=?", [dateTimeStr(new Date()), n.notification_ID]);
        result.sent++;
      } catch (err) {
        const failedForGood = n.attempts + 1 >= MAX_ATTEMPTS;
        await db.execute('UPDATE notification SET status=?, attempts=attempts+1 WHERE notification_ID=?', [failedForGood ? 'failed' : 'queued', n.notification_ID]);
        failedForGood ? result.failed++ : result.retried++;
      }
    }
  } finally {
    running = false;
  }
  return result;
}

let timer = null;
function start() {
  if (timer) return;
  const tick = () => processDue().catch((err) => console.error('Notifier error:', err.message));
  tick();
  timer = setInterval(tick, notifierSeconds * 1000);
  timer.unref();
  console.log(`Automation job running every ${notifierSeconds} seconds.`);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { processDue, start, stop };
