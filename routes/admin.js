// Staff API under /api/admin: sign in, the Overview numbers, the automation button,
// and (through ./staff) doctors, schedules and appointments.
//
// Everything below the sign in routes needs a signed in staff member. A staff member is
// recognised in either of two ways, so the dashboard works however it sends its credentials:
//   1. the session cookie that /login sets, or
//   2. the token that /login returns, sent as "Authorization: Bearer <token>" or "x-admin-token".
const crypto = require('crypto');
const express = require('express');
const db = require('../config/db');
const notifier = require('../services/notifier');
const t = require('../services/time');
const staffRoutes = require('./staff');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ---------- Sign in ----------
const isProd = process.env.NODE_ENV === 'production';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

// The demo login (admin / 101) only exists outside production. In production the staff
// dashboard stays closed until STAFF_USERNAME and STAFF_PASSWORD are set in the environment.
function staffCredentials() {
  return {
    username: process.env.STAFF_USERNAME || (isProd ? '' : 'admin'),
    password: process.env.STAFF_PASSWORD || (isProd ? '' : '101')
  };
}

// Compare through a hash so the check takes the same time whether or not the first characters match.
const digest = (v) => crypto.createHash('sha256').update(String(v)).digest();
const sameText = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

// Tokens live in memory, so restarting the server signs everyone out.
const tokens = new Map(); // token -> { username, expiresAt }

function issueToken(username) {
  const now = Date.now();
  for (const [token, info] of tokens) if (info.expiresAt <= now) tokens.delete(token); // tidy up
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + TOKEN_TTL_MS;
  tokens.set(token, { username, expiresAt });
  return { token, expiresAt };
}

function tokenFromRequest(req) {
  const auth = req.get('authorization') || '';
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return req.get('x-admin-token') || req.get('x-staff-token') || '';
}

// Returns { username } for a signed in staff member, or null.
function staffFromRequest(req) {
  if (req.session && req.session.staff === true) return { username: req.session.staffUser || 'staff' };
  const token = tokenFromRequest(req);
  const info = token ? tokens.get(token) : null;
  return info && info.expiresAt > Date.now() ? { username: info.username } : null;
}

function requireStaff(req, res, next) {
  const staff = staffFromRequest(req);
  if (!staff) return res.status(401).json({ error: 'Please sign in as staff.', code: 'STAFF_AUTH' });
  req.staff = staff;
  next();
}

// Slow down password guessing: 10 failed sign ins per 15 minutes for each visitor.
const failedLogins = new Map();
function loginLimiter(req, res, next) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recent = (failedLogins.get(req.ip) || []).filter((time) => now - time < windowMs);
  failedLogins.set(req.ip, recent);
  if (recent.length >= 10) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many failed sign in attempts. Please try again later.', code: 'RATE_LIMIT', retryAfter });
  }
  res.on('finish', () => { if (res.statusCode === 401) failedLogins.get(req.ip).push(Date.now()); });
  next();
}

router.get('/status', (req, res) => {
  res.json({ enabled: !!staffCredentials().password });
});

router.post('/login', loginLimiter, (req, res) => {
  const expected = staffCredentials();
  if (!expected.password) {
    return res.status(503).json({ error: 'Staff sign in is not set up. Set STAFF_USERNAME and STAFF_PASSWORD on the server.', code: 'ADMIN_OFF' });
  }
  const { username, password } = req.body || {};
  if (!(sameText(username ?? '', expected.username) && sameText(password ?? '', expected.password))) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const finish = () => {
    const { token, expiresAt } = issueToken(expected.username);
    res.json({ ok: true, token, expiresAt, user: { username: expected.username } });
  };
  if (!req.session) return finish();
  // A fresh session on every sign in stops session fixation.
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Could not start a session.' });
    req.session.staff = true;
    req.session.staffUser = expected.username;
    finish();
  });
});

router.post('/logout', (req, res) => {
  const token = tokenFromRequest(req);
  if (token) tokens.delete(token);
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ---------- Everything below needs a signed in staff member ----------
router.use(requireStaff);

router.get('/me', (req, res) => {
  res.json({ ok: true, user: { username: req.staff.username } });
});

// Numbers for the Overview page. The "data" block keeps the old response shape
// (confirmed, cancelled, total) in case something still reads it.
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
            SUM(status = 'confirmed') AS confirmed,
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

  const numbers = {
    upcoming: Number(stats.upcoming) || 0,
    today: Number(stats.today) || 0,
    confirmed: Number(stats.confirmed) || 0,
    cancelled: Number(stats.cancelled) || 0,
    total: Number(stats.total) || 0
  };
  const maskPhone = (p) => `${p.slice(0, 4)}***${p.slice(-4)}`;

  res.json({
    ok: true,
    data: { confirmed: numbers.confirmed, cancelled: numbers.cancelled, total: numbers.total },
    today,
    stats: numbers,
    todayList,
    byDepartment,
    doctorLoad,
    notifications: {
      counts: Object.fromEntries(queue.map((q) => [q.status, q.n])),
      recent: recent.map((r) => ({ ...r, phone: maskPhone(r.phone) }))
    }
  });
}));

// Lets staff trigger the automation job right now instead of waiting for the timer.
router.post('/run-notifier', wrap(async (req, res) => {
  res.json(await notifier.processDue());
}));

// Doctors, schedules and appointments: /api/admin/doctors, /api/admin/appointments, ...
router.use('/', staffRoutes);

module.exports = router;
module.exports.requireStaff = requireStaff; // server.js uses this to protect /api/staff too