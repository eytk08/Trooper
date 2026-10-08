// Scheduling rules: slot generation, availability, conflict free booking, cancelling.
const crypto = require('crypto');
const db = require('../config/db');
const { leadDays, windowDays, reminderHours } = require('../config/env');
const { AppError } = require('./errors');
const makeMessage = require('./messages');
const t = require('./time');

const PHONE_RE = /^09\d{9}$/;
const NAME_RE = /^[\p{L}\p{M}\p{N} .'\/-]{2,80}$/u;
const CLASSES = ['veteran', 'beneficiary', 'civilian'];

// Accepts 09171234567, 0917 123 4567, +63 917 123 4567 and stores 09171234567
function normalizePhone(input) {
  let digits = String(input || '').replace(/[\s()-]/g, '');
  if (digits.startsWith('+63')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('63') && digits.length === 12) digits = '0' + digits.slice(2);
  return PHONE_RE.test(digits) ? digits : null;
}

// ---------- Catalog ----------
async function getCatalog() {
  const [departments] = await db.query(
    `SELECT d.department_ID, d.slug, d.name, d.name_fil,
            (SELECT COUNT(*) FROM doctor WHERE fk_department_ID = d.department_ID AND status = 'active') AS doctorCount
       FROM department AS d ORDER BY d.sort_order`);
  const [clinics] = await db.query(
    'SELECT clinic_ID, fk_department_ID, slug, name, name_fil FROM clinic ORDER BY sort_order');
  return departments.map((d) => ({
    slug: d.slug,
    name: d.name,
    nameFil: d.name_fil,
    doctorCount: d.doctorCount,
    clinics: clinics
      .filter((c) => c.fk_department_ID === d.department_ID)
      .map((c) => ({ slug: c.slug, name: c.name, nameFil: c.name_fil }))
  }));
}

async function listDoctors({ department, clinic }) {
  const params = [department];
  let clinicSql = '';
  if (clinic) { clinicSql = 'AND c.slug = ?'; params.push(clinic); }
  const [rows] = await db.query(
    `SELECT d.doctor_ID AS id, d.doctorName AS name, d.specialization, dep.slug AS department, c.slug AS clinic
       FROM doctor AS d
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
       LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID
      WHERE d.status = 'active' AND dep.slug = ? ${clinicSql}
      ORDER BY d.doctorName`, params);
  if (!rows.length) return [];
  const [days] = await db.query(
    'SELECT fk_doctor_ID, GROUP_CONCAT(weekday ORDER BY weekday) AS days FROM doctor_schedule WHERE fk_doctor_ID IN (?) GROUP BY fk_doctor_ID',
    [rows.map((r) => r.id)]);
  const byDoctor = Object.fromEntries(days.map((d) => [d.fk_doctor_ID, d.days.split(',').map((n) => t.DAYS[+n])]));
  return rows.map((r) => ({ ...r, workingDays: byDoctor[r.id] || [] }));
}

// ---------- Slot generation ----------
// A schedule row becomes hourly (or whatever slot_minutes says) slots. Nothing is stored.
function makeSlots(schedule) {
  const start = t.toMinutes(schedule.start_time);
  const end = t.toMinutes(schedule.end_time);
  const slots = [];
  for (let m = start; m + schedule.slot_minutes <= end; m += schedule.slot_minutes) {
    slots.push({ start: t.fromMinutes(m), end: t.fromMinutes(m + schedule.slot_minutes) });
  }
  return slots;
}

// Open slots for one doctor over the booking window, with how many places are left.
// Rule 1: each slot holds ceil(max_patients / number of slots) patients.
// Rule 2: the doctor never goes over max_patients for the whole day.
async function availability(doctorId, conn = db) {
  const from = t.addDays(t.today(), leadDays);
  const to = t.addDays(from, windowDays - 1);

  const [schedules] = await conn.query(
    'SELECT weekday, start_time, end_time, slot_minutes, max_patients FROM doctor_schedule WHERE fk_doctor_ID = ?', [doctorId]);
  const byWeekday = Object.fromEntries(schedules.map((s) => [s.weekday, s]));

  const [booked] = await conn.query(
    `SELECT appointment_date AS d, slot_start AS s, COUNT(*) AS n
       FROM appointment
      WHERE fk_doctor_ID = ? AND status = 'confirmed' AND appointment_date BETWEEN ? AND ?
      GROUP BY appointment_date, slot_start`, [doctorId, from, to]);
  const perSlot = new Map();
  const perDay = new Map();
  booked.forEach((b) => {
    perSlot.set(`${b.d}|${b.s.slice(0, 5)}`, b.n);
    perDay.set(b.d, (perDay.get(b.d) || 0) + b.n);
  });

  const now = new Date();
  const dates = [];
  for (let i = 0; i < windowDays; i++) {
    const date = t.addDays(from, i);
    const schedule = byWeekday[t.weekdayOf(date)];
    if (!schedule) continue;
    const all = makeSlots(schedule);
    if (!all.length) continue;
    const capacity = Math.ceil(schedule.max_patients / all.length);
    const dayLeft = schedule.max_patients - (perDay.get(date) || 0);
    const open = [];
    for (const slot of all) {
      const left = Math.min(capacity - (perSlot.get(`${date}|${slot.start}`) || 0), dayLeft);
      if (left > 0 && t.slotDate(date, slot.start) > now) open.push({ ...slot, remaining: left });
    }
    if (open.length) dates.push({ date, weekday: t.DAYS[t.weekdayOf(date)], slots: open });
  }
  return dates;
}

// Automation for first time patients: find the earliest open time across every doctor in
// the clinic, so the patient never has to compare doctors.
async function nextAvailable({ department, clinic, limit = 5 }) {
  const doctors = await listDoctors({ department, clinic });
  const options = [];
  for (const doc of doctors) {
    const dates = await availability(doc.id);
    for (const day of dates) {
      const first = day.slots[0]; // earliest slot of that doctor on that day
      options.push({ doctorId: doc.id, doctorName: doc.name, specialization: doc.specialization, date: day.date, start: first.start, end: first.end, remaining: first.remaining });
    }
  }
  options.sort((a, b) => (a.date + a.start + a.doctorName).localeCompare(b.date + b.start + b.doctorName));
  return options.slice(0, limit);
}

// ---------- Booking ----------
const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0, O, 1, I, L
function newReference() {
  const bytes = crypto.randomBytes(6);
  return 'TRP-' + [...bytes].map((b) => REF_CHARS[b % REF_CHARS.length]).join('');
}

function cleanBooking(input) {
  const doctorId = Number(input.doctorId);
  const patientName = String(input.patientName || '').trim().replace(/\s+/g, ' ');
  const phone = normalizePhone(input.phone);
  const start = String(input.start || '');
  const date = String(input.date || '');
  if (!Number.isInteger(doctorId) || doctorId < 1) throw new AppError(400, 'BAD_DOCTOR', 'Please choose a doctor.');
  if (!t.parseYmd(date)) throw new AppError(400, 'BAD_DATE', 'Please choose a valid date.');
  if (!/^\d{2}:\d{2}$/.test(start)) throw new AppError(400, 'BAD_TIME', 'Please choose a valid time.');
  if (!NAME_RE.test(patientName)) throw new AppError(400, 'BAD_NAME', 'Please enter the patient name (2 to 80 characters).');
  if (!CLASSES.includes(input.patientClass)) throw new AppError(400, 'BAD_CLASS', 'Please choose veteran, beneficiary or civilian.');
  if (!phone) throw new AppError(400, 'BAD_PHONE', 'Please enter a valid mobile number, for example 09171234567.');
  return {
    doctorId, date, start, patientName, phone,
    patientClass: input.patientClass,
    isNewPatient: input.isNewPatient ? 1 : 0,
    language: input.language === 'fil' ? 'fil' : 'en'
  };
}

async function book(input) {
  const b = cleanBooking(input);
  const conn = await db.getConnection();
  try {
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();

    // Locking the doctor row makes bookings for one doctor happen one at a time.
    // Two patients tapping the last slot together can never both get it.
    const [locked] = await conn.query("SELECT doctor_ID FROM doctor WHERE doctor_ID = ? AND status = 'active' FOR UPDATE", [b.doctorId]);
    if (!locked.length) throw new AppError(404, 'NO_DOCTOR', 'That doctor is not available.');

    const open = await availability(b.doctorId, conn);
    const day = open.find((d) => d.date === b.date);
    if (!day || !day.slots.some((s) => s.start === b.start)) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'That time was just taken. Please pick another one.');
    }
    const slot = day.slots.find((s) => s.start === b.start);

    const [dup] = await conn.query(
      "SELECT 1 FROM appointment WHERE contact_phone = ? AND fk_doctor_ID = ? AND appointment_date = ? AND status = 'confirmed' LIMIT 1",
      [b.phone, b.doctorId, b.date]);
    if (dup.length) throw new AppError(409, 'ALREADY_BOOKED', 'This number already has an appointment with this doctor on that day.');

    let reference;
    let appointmentId;
    for (let attempt = 0; attempt < 5; attempt++) {
      reference = newReference();
      try {
        const [ins] = await conn.execute(
          `INSERT INTO appointment (reference_code, fk_doctor_ID, appointment_date, slot_start, patient_name, patient_class, is_new_patient, contact_phone, language)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [reference, b.doctorId, b.date, b.start + ':00', b.patientName, b.patientClass, b.isNewPatient, b.phone, b.language]);
        appointmentId = ins.insertId;
        break;
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY' || attempt === 4) throw err; // reference clash: try a new code
      }
    }

    const [[info]] = await conn.query(
      `SELECT d.doctorName, dep.name AS department, dep.name_fil AS departmentFil, c.name AS clinic, c.name_fil AS clinicFil
         FROM doctor AS d JOIN department AS dep ON dep.department_ID = d.fk_department_ID
         LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID WHERE d.doctor_ID = ?`, [b.doctorId]);

    // Automation: queue the confirmation now and the reminder for later.
    const text = { doctor: info.doctorName, date: b.date, start: b.start, ref: reference };
    const now = new Date();
    await conn.execute("INSERT INTO notification (fk_appointment_ID, type, message, send_at) VALUES (?, 'confirmation', ?, ?)",
      [appointmentId, makeMessage(b.language, 'confirmation', text), t.dateTimeStr(now)]);

    const reminderAt = new Date(t.slotDate(b.date, b.start).getTime() - reminderHours * 3600 * 1000);
    const reminderQueued = reminderAt.getTime() > now.getTime() + 5 * 60 * 1000;
    if (reminderQueued) {
      await conn.execute("INSERT INTO notification (fk_appointment_ID, type, message, send_at) VALUES (?, 'reminder', ?, ?)",
        [appointmentId, makeMessage(b.language, 'reminder', text), t.dateTimeStr(reminderAt)]);
    }

    await conn.commit();
    return {
      reference, doctor: info.doctorName, department: info.department, clinic: info.clinic,
      date: b.date, start: slot.start, end: slot.end,
      reminder: { queued: reminderQueued, at: reminderQueued ? t.dateTimeStr(reminderAt) : null, hoursBefore: reminderHours }
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ---------- Look up and cancel ----------
async function findAppointment(reference, phoneInput, conn = db, lock = false) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new AppError(400, 'BAD_PHONE', 'Please enter the mobile number used for the booking.');
  const [rows] = await conn.query(
    `SELECT a.*, d.doctorName, dep.name AS department, c.name AS clinic
       FROM appointment AS a
       JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
       JOIN department AS dep ON dep.department_ID = d.fk_department_ID
       LEFT JOIN clinic AS c ON c.clinic_ID = d.fk_clinic_ID
      WHERE a.reference_code = ? AND a.contact_phone = ? ${lock ? 'FOR UPDATE' : ''}`,
    [String(reference || '').toUpperCase().trim(), phone]);
  // Same answer for "wrong code" and "wrong number" so codes cannot be guessed.
  if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'No appointment matches that reference code and mobile number.');
  return rows[0];
}

function shape(a) {
  const when = t.slotDate(a.appointment_date, a.slot_start.slice(0, 5));
  return {
    reference: a.reference_code, status: a.status, patientName: a.patient_name,
    doctor: a.doctorName, department: a.department, clinic: a.clinic,
    date: a.appointment_date, start: a.slot_start.slice(0, 5),
    canCancel: a.status === 'confirmed' && when > new Date()
  };
}

async function lookup(reference, phone) {
  return shape(await findAppointment(reference, phone));
}

async function cancel(reference, phone) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const a = await findAppointment(reference, phone, conn, true);
    if (a.status === 'cancelled') throw new AppError(409, 'ALREADY_CANCELLED', 'This appointment is already cancelled.');
    const start = a.slot_start.slice(0, 5);
    if (t.slotDate(a.appointment_date, start) <= new Date()) throw new AppError(409, 'PAST', 'This appointment has already passed.');

    // Releasing the slot is automatic: availability only counts confirmed appointments.
    await conn.execute("UPDATE appointment SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE appointment_ID = ?", [a.appointment_ID]);
    // Anything not yet sent for this appointment is no longer needed.
    await conn.execute("UPDATE notification SET status = 'skipped' WHERE fk_appointment_ID = ? AND status = 'queued'", [a.appointment_ID]);
    await conn.execute("INSERT INTO notification (fk_appointment_ID, type, message, send_at) VALUES (?, 'cancellation', ?, ?)",
      [a.appointment_ID, makeMessage(a.language, 'cancellation', { ref: a.reference_code, date: a.appointment_date }), t.dateTimeStr(new Date())]);
    await conn.commit();
    return { ...shape({ ...a, status: 'cancelled' }), canCancel: false };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getCatalog, listDoctors, availability, nextAvailable, book, lookup, cancel, normalizePhone, makeSlots };
