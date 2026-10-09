// Staff CRUD: doctors, their weekly schedules (the working hours that become bookable
// slots), and appointments. Mounted inside routes/admin.js, so every route here already
// requires a signed-in staff member.
const express = require('express');
const db = require('../config/db');
const scheduling = require('../services/scheduling');
const { AppError } = require('../services/errors');
const t = require('../services/time');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);



const toId = (v, what = 'record') => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, 'BAD_ID', `Invalid ${what}.`);
  return n;
};
const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

// ---------- Catalog (for the dropdowns) ----------
router.get('/catalog', wrap(async (req, res) => {
  res.json({ departments: await scheduling.getCatalog() });
}));

// ---------- Doctors ----------
async function selectDoctors({ id, status, department, q } = {}) {
  const where = [];
  const params = [t.today()]; // first ? is the "upcoming" cutoff in the SELECT list
  if (id) { where.push('d.doctor_ID = ?'); params.push(id); }
  if (status) { where.push('d.status = ?'); params.push(status); }
  if (department) { where.push('dep.slug = ?'); params.push(department); }
  if (q) { where.push('(d.doctorName LIKE ? OR d.specialization LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  const [rows] = await db.query(
    `SELECT d.doctor_ID AS id, d.doctorName AS name, d.specialization, d.status,
            dep.slug AS department, dep.name AS departmentName,
            c.slug AS clinic, c.name AS clinicName,
            (SELECT COUNT(*) FROM appointment AS a
              WHERE a.fk_doctor_ID = d.doctor_ID AND a.status = 'confirmed' AND a.appointment_date >= ?) AS upcoming,
            (SELECT GROUP_CONCAT(s.weekday ORDER BY s.weekday) FROM doctor_schedule AS s WHERE s.fk_doctor_ID = d.doctor_ID) AS days
       FROM doctor AS d
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
       LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY dep.sort_order, d.doctorName, d.doctor_ID`, params);

  return rows.map((r) => ({
    id: r.id, name: r.name, specialization: r.specialization, status: r.status,
    department: r.department, departmentName: r.departmentName,
    clinic: r.clinic, clinicName: r.clinicName,
    upcoming: Number(r.upcoming) || 0,
    workingDays: r.days ? String(r.days).split(',').map(Number) : []
  }));
}

async function cleanDoctor(input) {
  const name = clean(input.doctorName);
  const specialization = clean(input.specialization);
  if (name.length < 2 || name.length > 80) throw new AppError(400, 'BAD_NAME', 'Doctor name must be 2 to 80 characters.');
  if (specialization.length < 2 || specialization.length > 80) throw new AppError(400, 'BAD_SPECIALIZATION', 'Specialization must be 2 to 80 characters.');
  const status = input.status === undefined ? 'active' : input.status;
  if (!['active', 'inactive'].includes(status)) throw new AppError(400, 'BAD_STATUS', 'Status must be active or inactive.');

  const [[dep]] = await db.query('SELECT department_ID FROM department WHERE slug = ?', [String(input.department || '')]);
  if (!dep) throw new AppError(400, 'BAD_DEPARTMENT', 'Please choose a department.');

  const [[count]] = await db.query('SELECT COUNT(*) AS n FROM clinic WHERE fk_department_ID = ?', [dep.department_ID]);
  let clinicId = null;
  if (input.clinic) {
    const [[clinic]] = await db.query('SELECT clinic_ID FROM clinic WHERE slug = ? AND fk_department_ID = ?', [String(input.clinic), dep.department_ID]);
    if (!clinic) throw new AppError(400, 'BAD_CLINIC', 'That clinic does not belong to the chosen department.');
    clinicId = clinic.clinic_ID;
  } else if (Number(count.n) > 0) {
    throw new AppError(400, 'BAD_CLINIC', 'This department has clinics. Please choose one.');
  }
  return { name, specialization, status, departmentId: dep.department_ID, clinicId };
}

router.get('/doctors', wrap(async (req, res) => {
  const status = ['active', 'inactive'].includes(req.query.status) ? req.query.status : null;
  const department = /^[a-z0-9-]{1,40}$/.test(req.query.department || '') ? req.query.department : null;
  const q = clean(req.query.q).slice(0, 60) || null;
  res.json({ doctors: await selectDoctors({ status, department, q }) });
}));

router.post('/doctors', wrap(async (req, res) => {
  const d = await cleanDoctor(req.body || {});
  const [ins] = await db.execute(
    'INSERT INTO doctor (doctorName, specialization, fk_department_ID, fk_clinic_ID, status) VALUES (?, ?, ?, ?, ?)',
    [d.name, d.specialization, d.departmentId, d.clinicId, d.status]);
  res.status(201).json((await selectDoctors({ id: ins.insertId }))[0]);
}));

router.put('/doctors/:id', wrap(async (req, res) => {
  const id = toId(req.params.id, 'doctor');
  if (!(await selectDoctors({ id })).length) throw new AppError(404, 'NOT_FOUND', 'Doctor not found.');
  const d = await cleanDoctor(req.body || {});
  await db.execute(
    'UPDATE doctor SET doctorName = ?, specialization = ?, fk_department_ID = ?, fk_clinic_ID = ?, status = ? WHERE doctor_ID = ?',
    [d.name, d.specialization, d.departmentId, d.clinicId, d.status, id]);
  res.json((await selectDoctors({ id }))[0]);
}));

// A doctor with appointment records cannot be deleted (the records must stay accurate).
// Set the doctor to inactive instead: they disappear from booking but the history is kept.
router.delete('/doctors/:id', wrap(async (req, res) => {
  const id = toId(req.params.id, 'doctor');
  if (!(await selectDoctors({ id })).length) throw new AppError(404, 'NOT_FOUND', 'Doctor not found.');
  const [[used]] = await db.query('SELECT COUNT(*) AS n FROM appointment WHERE fk_doctor_ID = ?', [id]);
  if (Number(used.n) > 0) {
    throw new AppError(409, 'HAS_APPOINTMENTS', 'This doctor has appointment records and cannot be deleted. Set the doctor to inactive instead.');
  }
  await db.execute('DELETE FROM doctor WHERE doctor_ID = ?', [id]); // schedule rows are removed by the foreign key
  res.json({ deleted: true });
}));

// ---------- Doctor schedules (working days and hours) ----------
const hhmmOk = (v) => /^\d{2}:\d{2}$/.test(v) && +v.slice(0, 2) < 24 && +v.slice(3) < 60;

function cleanSchedule(body) {
  const start = String(body.start || '');
  const end = String(body.end || '');
  const slotMinutes = Number(body.slotMinutes);
  const maxPatients = Number(body.maxPatients);
  if (!hhmmOk(start) || !hhmmOk(end)) throw new AppError(400, 'BAD_TIME', 'Use the format HH:MM for the start and end time.');
  if (t.toMinutes(end) <= t.toMinutes(start)) throw new AppError(400, 'BAD_TIME', 'The end time must be after the start time.');
  if (!Number.isInteger(slotMinutes) || slotMinutes < 10 || slotMinutes > 240) throw new AppError(400, 'BAD_SLOT', 'Slot length must be between 10 and 240 minutes.');
  if (t.toMinutes(end) - t.toMinutes(start) < slotMinutes) throw new AppError(400, 'BAD_SLOT', 'The working hours must fit at least one slot.');
  if (!Number.isInteger(maxPatients) || maxPatients < 1 || maxPatients > 500) throw new AppError(400, 'BAD_MAX', 'Daily patient limit must be between 1 and 500.');
  return { start, end, slotMinutes, maxPatients };
}

// How many confirmed future appointments sit on this weekday. Shown to staff as a warning
// because changing or removing a day does not move appointments that are already booked.
async function upcomingOnWeekday(doctorId, weekday) {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS n FROM appointment WHERE fk_doctor_ID = ? AND status = 'confirmed' AND appointment_date >= ? AND DAYOFWEEK(appointment_date) = ?",
    [doctorId, t.today(), weekday + 1]); // MySQL DAYOFWEEK: 1 = Sunday
  return Number(row.n) || 0;
}

const toWeekday = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 6) throw new AppError(400, 'BAD_WEEKDAY', 'Weekday must be 0 (Sunday) to 6 (Saturday).');
  return n;
};

router.get('/doctors/:id/schedule', wrap(async (req, res) => {
  const id = toId(req.params.id, 'doctor');
  if (!(await selectDoctors({ id })).length) throw new AppError(404, 'NOT_FOUND', 'Doctor not found.');
  const [rows] = await db.query(
    'SELECT weekday, start_time, end_time, slot_minutes, max_patients FROM doctor_schedule WHERE fk_doctor_ID = ? ORDER BY weekday', [id]);
  res.json({
    schedule: rows.map((r) => ({
      weekday: r.weekday, day: t.DAYS[r.weekday],
      start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5),
      slotMinutes: r.slot_minutes, maxPatients: r.max_patients
    }))
  });
}));

router.put('/doctors/:id/schedule/:weekday', wrap(async (req, res) => {
  const id = toId(req.params.id, 'doctor');
  const weekday = toWeekday(req.params.weekday);
  if (!(await selectDoctors({ id })).length) throw new AppError(404, 'NOT_FOUND', 'Doctor not found.');
  const s = cleanSchedule(req.body || {});
  await db.execute(
    `INSERT INTO doctor_schedule (fk_doctor_ID, weekday, start_time, end_time, slot_minutes, max_patients)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time),
                             slot_minutes = VALUES(slot_minutes), max_patients = VALUES(max_patients)`,
    [id, weekday, s.start + ':00', s.end + ':00', s.slotMinutes, s.maxPatients]);
  res.json({ weekday, day: t.DAYS[weekday], ...s, affectedUpcoming: await upcomingOnWeekday(id, weekday) });
}));

router.delete('/doctors/:id/schedule/:weekday', wrap(async (req, res) => {
  const id = toId(req.params.id, 'doctor');
  const weekday = toWeekday(req.params.weekday);
  if (!(await selectDoctors({ id })).length) throw new AppError(404, 'NOT_FOUND', 'Doctor not found.');
  await db.execute('DELETE FROM doctor_schedule WHERE fk_doctor_ID = ? AND weekday = ?', [id, weekday]);
  res.json({ deleted: true, affectedUpcoming: await upcomingOnWeekday(id, weekday) });
}));

// ---------- Appointments ----------
const staffShape = (a) => ({
  id: a.appointment_ID,
  reference: a.reference_code,
  patientName: a.patient_name,
  patientClass: a.patient_class,
  isNewPatient: !!a.is_new_patient,
  phone: a.contact_phone,
  language: a.language,
  status: a.status,
  date: a.appointment_date,
  start: a.slot_start.slice(0, 5),
  doctorId: a.fk_doctor_ID,
  doctor: a.doctorName,
  department: a.department,
  clinic: a.clinic,
  createdAt: a.created_at,
  cancelledAt: a.cancelled_at
});

router.get('/appointments', wrap(async (req, res) => {
  const where = [];
  const params = [];
  const { status, date, from, to, doctorId, order } = req.query;
  const q = clean(req.query.q).slice(0, 40);

  if (['confirmed', 'cancelled'].includes(status)) { where.push('a.status = ?'); params.push(status); }
  if (date) { if (!t.parseYmd(date)) throw new AppError(400, 'BAD_DATE', 'Invalid date.'); where.push('a.appointment_date = ?'); params.push(date); }
  if (from) { if (!t.parseYmd(from)) throw new AppError(400, 'BAD_DATE', 'Invalid date.'); where.push('a.appointment_date >= ?'); params.push(from); }
  if (to) { if (!t.parseYmd(to)) throw new AppError(400, 'BAD_DATE', 'Invalid date.'); where.push('a.appointment_date <= ?'); params.push(to); }
  if (doctorId) { where.push('a.fk_doctor_ID = ?'); params.push(toId(doctorId, 'doctor')); }
  if (q) {
    where.push('(a.reference_code LIKE ? OR a.patient_name LIKE ? OR a.contact_phone LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const dir = order === 'desc' ? 'DESC' : 'ASC';

  const [[total]] = await db.query(`SELECT COUNT(*) AS n FROM appointment AS a ${whereSql}`, params);
  const [rows] = await db.query(
    `SELECT a.*, d.doctorName, dep.name AS department, c.name AS clinic
       FROM appointment AS a
       JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
       LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID
       ${whereSql}
      ORDER BY a.appointment_date ${dir}, a.slot_start ${dir}, a.appointment_ID ${dir}
      LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize]);

  res.json({ appointments: rows.map(staffShape), total: Number(total.n) || 0, page, pageSize });
}));

router.get('/appointments/:id', wrap(async (req, res) => {
  res.json(staffShape(await scheduling.findById(toId(req.params.id, 'appointment'))));
}));

// Staff booking (phone or walk-in). Uses the exact same checks and transaction as the chatbot.
router.post('/appointments', wrap(async (req, res) => {
  res.status(201).json(await scheduling.book(req.body || {}));
}));

router.patch('/appointments/:id', wrap(async (req, res) => {
  res.json(staffShape(await scheduling.updateDetails(toId(req.params.id, 'appointment'), req.body || {})));
}));

router.post('/appointments/:id/reschedule', wrap(async (req, res) => {
  res.json(staffShape(await scheduling.reschedule(toId(req.params.id, 'appointment'), req.body || {})));
}));

router.post('/appointments/:id/cancel', wrap(async (req, res) => {
  res.json(staffShape(await scheduling.cancelById(toId(req.params.id, 'appointment'))));
}));

// Permanently removes the record (queued messages are removed by the foreign key).
// Cancelling is usually what you want, because it keeps the history.
router.delete('/appointments/:id', wrap(async (req, res) => {
  const id = toId(req.params.id, 'appointment');
  await scheduling.findById(id); // 404 if it does not exist
  await db.execute('DELETE FROM appointment WHERE appointment_ID = ?', [id]);
  res.json({ deleted: true });
}));

module.exports = router;
