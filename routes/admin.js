const express = require('express');
const db = require('../config/db');
const notifier = require('../services/notifier');
const limit = require('../middleware/limit');
const staffAuth = require('../middleware/staffAuth');
const t = require('../services/time');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(limit({ max: 600, windowMs: 15 * 60 * 1000 }));

// Staff sign-in. Needs STAFF_USERNAME and STAFF_PASSWORD in .env.
router.post('/login', limit({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many sign-in attempts. Please wait a few minutes and try again.' }), (req, res) => {
  if (!staffAuth.loginEnabled()) {
    return res.status(503).json({ error: 'Staff sign-in is off. Set STAFF_USERNAME and STAFF_PASSWORD in .env to turn it on.', code: 'LOGIN_OFF' });
  }
  const { username, password } = req.body || {};
  if (!staffAuth.checkCredentials(username, password)) {
    return res.status(401).json({ error: 'Wrong username or password.', code: 'BAD_LOGIN' });
  }
  const { token, expiresAt } = staffAuth.issueToken(process.env.STAFF_USERNAME);
  res.json({ token, expiresAt, user: { username: process.env.STAFF_USERNAME } });
});

// Everything below needs a valid session (or the legacy x-admin-token header)
router.use(staffAuth.requireStaff);

router.get('/me', (req, res) => res.json({ user: { username: req.staff.username } }));

const maskPhone = (p) => `${p.slice(0, 4)}***${p.slice(-4)}`;

router.get('/summary', wrap(async (req, res) => {
  const today = t.today();
  const weekEnd = t.addDays(today, 6);

  const [todayList] = await db.query(
    `SELECT a.reference_code AS reference, a.slot_start AS start, a.patient_name AS patient, a.patient_class AS class,
            a.status, d.doctorName AS doctor, dep.name AS department, c.name AS clinic
       FROM appointment AS a
       JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
       LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID
      WHERE a.appointment_date = ? ORDER BY a.slot_start`, [today]);

  const [[stats]] = await db.query(
    `SELECT SUM(status = 'confirmed' AND appointment_date >= ?) AS upcoming,
            SUM(status = 'confirmed' AND appointment_date = ?)  AS today,
            SUM(status = 'cancelled') AS cancelled,
            COUNT(*) AS total
       FROM appointment`, [today, today]);

  const [byDepartment] = await db.query(
    `SELECT dep.name AS department, COUNT(*) AS booked
       FROM appointment AS a
       JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
      WHERE a.status = 'confirmed' AND a.appointment_date >= ?
      GROUP BY dep.department_ID, dep.name ORDER BY booked DESC`, [today]);

  const [doctorLoad] = await db.query(
    `SELECT d.doctorName AS doctor, COUNT(*) AS booked
       FROM appointment AS a JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
      WHERE a.status = 'confirmed' AND a.appointment_date BETWEEN ? AND ?
      GROUP BY d.doctor_ID, d.doctorName ORDER BY booked DESC, d.doctorName LIMIT 8`, [today, weekEnd]);

  const [queue] = await db.query('SELECT status, COUNT(*) AS n FROM notification GROUP BY status');
  const [recent] = await db.query(
    `SELECT n.type, n.status, n.send_at AS sendAt, n.sent_at AS sentAt, a.reference_code AS reference, a.contact_phone AS phone
       FROM notification AS n JOIN appointment AS a ON a.appointment_ID = n.fk_appointment_ID
      ORDER BY n.notification_ID DESC LIMIT 15`);

  res.json({
    today, stats: { upcoming: +stats.upcoming || 0, today: +stats.today || 0, cancelled: +stats.cancelled || 0, total: +stats.total || 0 },
    todayList, byDepartment, doctorLoad,
    notifications: { counts: Object.fromEntries(queue.map((q) => [q.status, q.n])), recent: recent.map((r) => ({ ...r, phone: maskPhone(r.phone) })) }
  });
}));

// Lets staff (or a demo) trigger the automation job right now instead of waiting for the timer.
router.post('/run-notifier', wrap(async (req, res) => {
  res.json(await notifier.processDue());
}));

// Doctors, schedules and appointments (create, read, update, delete)
router.use(require('./staff'));

module.exports = router;
