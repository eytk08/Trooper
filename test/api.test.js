// Run with: npm test   (needs MySQL; uses its own database called trooper_test)
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'trooper_test';
process.env.ADMIN_TOKEN = 'test_token';
process.env.STAFF_USERNAME = 'staff';
process.env.STAFF_PASSWORD = 'test_password';
process.env.BOOKING_RATE_LIMIT = '1000'; // the limiter itself has its own test below
require('../config/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

let server, base, db, scheduling, notifier, sms;

async function call(method, url, body, headers = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, data };
}

let phoneCounter = 0;
const nextPhone = () => '0918' + String(1000000 + ++phoneCounter);
const person = (extra = {}) => ({ patientName: 'Test Patient', patientClass: 'civilian', isNewPatient: true, phone: nextPhone(), language: 'en', ...extra });

test.before(async () => {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  await conn.query('CREATE DATABASE IF NOT EXISTS trooper_test CHARACTER SET utf8mb4');
  await conn.query('USE trooper_test');
  await conn.query(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
  await conn.query(fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8'));
  await conn.end();

  db = require('../config/db');
  scheduling = require('../services/scheduling');
  notifier = require('../services/notifier');
  sms = require('../services/sms');
  server = require('../server').listen(0);
  base = `http://localhost:${server.address().port}`;
});

test.after(async () => {
  server.close();
  await db.end();
});

// ---------- Catalog ----------
test('config lists 10 departments and every clinic has doctors', async () => {
  const { status, data } = await call('GET', '/api/config');
  assert.equal(status, 200);
  assert.equal(data.departments.length, 10);
  const surgical = data.departments.find((d) => d.slug === 'surgical');
  assert.equal(surgical.clinics.length, 4);
  for (const dep of data.departments) {
    for (const clinic of dep.clinics) {
      const r = await call('GET', `/api/doctors?department=${dep.slug}&clinic=${clinic.slug}`);
      assert.ok(r.data.doctors.length > 0, `${dep.slug}/${clinic.slug} has no doctors`);
    }
    if (!dep.clinics.length) {
      const r = await call('GET', `/api/doctors?department=${dep.slug}`);
      assert.ok(r.data.doctors.length > 0, `${dep.slug} has no doctors`);
    }
  }
});

test('doctor list includes working days', async () => {
  const { data } = await call('GET', '/api/doctors?department=surgical&clinic=urology');
  assert.equal(data.doctors.length, 2);
  assert.deepEqual(data.doctors.find((d) => d.name === 'Dr. Antonio Reyes').workingDays, ['Monday', 'Wednesday', 'Friday']);
});

test('doctors endpoint rejects a missing or unsafe department', async () => {
  assert.equal((await call('GET', '/api/doctors')).status, 400);
  assert.equal((await call('GET', "/api/doctors?department=x'; DROP TABLE doctor;--")).status, 400);
});

// ---------- Availability ----------
test('availability only shows working days inside the booking window', async () => {
  const { data } = await call('GET', '/api/doctors/1/availability'); // Mon, Wed, Fri 8 to 12
  assert.ok(data.dates.length > 0);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  for (const d of data.dates) {
    assert.ok(['Monday', 'Wednesday', 'Friday'].includes(d.weekday), d.weekday);
    assert.deepEqual(d.slots.map((s) => s.start), ['08:00', '09:00', '10:00', '11:00']);
    assert.ok(d.date >= require('../services/time').ymd(tomorrow));
  }
});

test('next available returns the earliest options across doctors, sorted', async () => {
  const { data } = await call('GET', '/api/availability/next?department=surgical&clinic=urology&limit=5');
  assert.ok(data.options.length >= 2 && data.options.length <= 5);
  const keys = data.options.map((o) => o.date + o.start);
  assert.deepEqual(keys, [...keys].sort());
  assert.ok(new Set(data.options.map((o) => o.doctorId)).size >= 2, 'should include both urology doctors');
});

// ---------- Booking ----------
test('booking works, returns a reference, and queues confirmation and reminder', async () => {
  const dates = (await call('GET', '/api/doctors/1/availability')).data.dates;
  const day = dates[dates.length - 1]; // far enough away for a 24 hour reminder
  const r = await call('POST', '/api/appointments', person({ doctorId: 1, date: day.date, start: '09:00' }));
  assert.equal(r.status, 201);
  assert.match(r.data.reference, /^TRP-[A-Z2-9]{6}$/);
  assert.equal(r.data.doctor, 'Dr. Antonio Reyes');
  assert.equal(r.data.reminder.queued, true);
  const [rows] = await db.query('SELECT n.type, n.status FROM notification n JOIN appointment a ON a.appointment_ID = n.fk_appointment_ID WHERE a.reference_code = ? ORDER BY n.type', [r.data.reference]);
  assert.deepEqual(rows.map((x) => x.type), ['confirmation', 'reminder']);
});

test('Filipino bookings get a Filipino confirmation text', async () => {
  const dates = (await call('GET', '/api/doctors/2/availability')).data.dates;
  const r = await call('POST', '/api/appointments', person({ doctorId: 2, date: dates[0].date, start: dates[0].slots[0].start, language: 'fil' }));
  assert.equal(r.status, 201);
  const [[n]] = await db.query("SELECT n.message FROM notification n JOIN appointment a ON a.appointment_ID = n.fk_appointment_ID WHERE a.reference_code = ? AND n.type = 'confirmation'", [r.data.reference]);
  assert.match(n.message, /Naka-book na/);
});

test('a full slot is refused (slot capacity is ceil(max / slots))', async () => {
  // doctor 3 (Dr. Ricardo Cruz): max 15 over 4 slots, so 4 patients per slot
  const dates = (await call('GET', '/api/doctors/3/availability')).data.dates;
  const day = dates[0];
  const results = [];
  const firstSlot = day.slots[0].start;
  for (let i = 0; i < 5; i++) results.push(await call('POST', '/api/appointments', person({ doctorId: 3, date: day.date, start: firstSlot })));
  assert.deepEqual(results.map((r) => r.status), [201, 201, 201, 201, 409]);
  assert.equal(results[4].data.code, 'SLOT_UNAVAILABLE');
  const after = (await call('GET', '/api/doctors/3/availability')).data.dates.find((d) => d.date === day.date);
  assert.ok(!after.slots.some((s) => s.start === firstSlot), 'full slot should disappear from availability');
});

test('the daily limit is enforced even when a slot still has room', async () => {
  // doctor 1: max 12 over 4 slots = 3 per slot, exactly 12. Pick a doctor where rounding matters instead.
  const [[row]] = await db.query(`SELECT s.fk_doctor_ID AS id, s.weekday, s.max_patients,
      TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / s.slot_minutes AS slots
    FROM doctor_schedule s WHERE s.max_patients % (TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / s.slot_minutes) <> 0 LIMIT 1`);
  assert.ok(row, 'sample data should contain a schedule where max does not divide evenly');
  const dates = (await call('GET', `/api/doctors/${row.id}/availability`)).data.dates;
  const day = dates.find((d) => new Date(d.date + 'T00:00:00Z').getUTCDay() === row.weekday);
  let ok = 0;
  for (const slot of day.slots) {
    for (let i = 0; i < 10; i++) {
      const r = await call('POST', '/api/appointments', person({ doctorId: row.id, date: day.date, start: slot.start }));
      if (r.status === 201) ok++; else break;
    }
  }
  assert.equal(ok, row.max_patients, 'never more than max_patients in one day');
});

test('10 people booking the same last slot at once: only the free places are given out', async () => {
  const dates = (await call('GET', '/api/doctors/4/availability')).data.dates; // doctor 4: 4 per slot
  const day = dates[0];
  const slotStart = day.slots[0].start;
  const results = await Promise.all(Array.from({ length: 10 }, () => call('POST', '/api/appointments', person({ doctorId: 4, date: day.date, start: slotStart }))));
  const ok = results.filter((r) => r.status === 201).length;
  const refused = results.filter((r) => r.status === 409 && r.data.code === 'SLOT_UNAVAILABLE').length;
  assert.equal(ok, 4, 'exactly the slot capacity succeeds');
  assert.equal(refused, 6);
  const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM appointment WHERE fk_doctor_ID = 4 AND appointment_date = ? AND slot_start = ? AND status = 'confirmed'", [day.date, slotStart + ':00']);
  assert.equal(n, 4, 'database agrees');
});

test('the same number cannot book the same doctor twice on one day', async () => {
  const dates = (await call('GET', '/api/doctors/5/availability')).data.dates;
  const day = dates[0];
  const p = person({ doctorId: 5, date: day.date, start: day.slots[0].start });
  assert.equal((await call('POST', '/api/appointments', p)).status, 201);
  const again = await call('POST', '/api/appointments', { ...p, start: day.slots[1].start });
  assert.equal(again.status, 409);
  assert.equal(again.data.code, 'ALREADY_BOOKED');
});

test('bad input is rejected', async () => {
  const dates = (await call('GET', '/api/doctors/6/availability')).data.dates;
  const good = person({ doctorId: 6, date: dates[0].date, start: dates[0].slots[0].start });
  const cases = [
    ['bad phone', { phone: '12345' }, 'BAD_PHONE'],
    ['html in name', { patientName: '<script>alert(1)</script>' }, 'BAD_NAME'],
    ['short name', { patientName: 'A' }, 'BAD_NAME'],
    ['bad class', { patientClass: 'vip' }, 'BAD_CLASS'],
    ['fake date', { date: '2026-02-31' }, 'BAD_DATE'],
    ['bad time text', { start: '9am' }, 'BAD_TIME'],
    ['missing doctor', { doctorId: 'abc' }, 'BAD_DOCTOR']
  ];
  for (const [name, patch, code] of cases) {
    const r = await call('POST', '/api/appointments', { ...good, ...patch });
    assert.equal(r.status, 400, name);
    assert.equal(r.data.code, code, name);
  }
  // a time that is not one of the generated slots
  assert.equal((await call('POST', '/api/appointments', { ...good, start: '08:30' })).status, 409);
  // a date in the past, and one outside the window
  assert.equal((await call('POST', '/api/appointments', { ...good, date: '2020-01-06' })).status, 409);
  assert.equal((await call('POST', '/api/appointments', { ...good, date: '2031-01-06' })).status, 409);
  // a weekday the doctor does not work
  const time = require('../services/time');
  const [worked] = await db.query('SELECT weekday FROM doctor_schedule WHERE fk_doctor_ID = 6');
  const workdays = new Set(worked.map((w) => w.weekday));
  let off = time.addDays(time.today(), 1);
  while (workdays.has(time.weekdayOf(off))) off = time.addDays(off, 1);
  assert.equal((await call('POST', '/api/appointments', { ...good, date: off })).status, 409);
  // an unknown doctor
  assert.equal((await call('POST', '/api/appointments', { ...good, doctorId: 99999 })).status, 404);
});

test('phone numbers are accepted in common formats and stored the same way', async () => {
  const dates = (await call('GET', '/api/doctors/7/availability')).data.dates;
  const r = await call('POST', '/api/appointments', person({ doctorId: 7, date: dates[0].date, start: dates[0].slots[0].start, phone: '+63 917 555 0101' }));
  assert.equal(r.status, 201);
  const [[row]] = await db.query('SELECT contact_phone FROM appointment WHERE reference_code = ?', [r.data.reference]);
  assert.equal(row.contact_phone, '09175550101');
});

// ---------- Look up and cancel ----------
test('lookup and cancel: needs the right number, releases the slot, skips queued messages', async () => {
  const dates = (await call('GET', '/api/doctors/8/availability')).data.dates;
  const day = dates[dates.length - 1];
  const first = day.slots[0].start;
  const p = person({ doctorId: 8, date: day.date, start: first, phone: '09175550202' });
  const booked = await call('POST', '/api/appointments', p);
  assert.equal(booked.status, 201);
  const ref = booked.data.reference;

  assert.equal((await call('GET', `/api/appointments/${ref}?phone=09179999999`)).status, 404, 'wrong number looks like not found');
  assert.equal((await call('GET', `/api/appointments/TRP-NOPE00?phone=${p.phone}`)).status, 404);
  const found = await call('GET', `/api/appointments/${ref.toLowerCase()}?phone=${p.phone}`);
  assert.equal(found.status, 200);
  assert.equal(found.data.status, 'confirmed');
  assert.equal(found.data.canCancel, true);

  const before = (await call('GET', '/api/doctors/8/availability')).data.dates.find((d) => d.date === day.date).slots.find((s) => s.start === first).remaining;
  const wrong = await call('POST', `/api/appointments/${ref}/cancel`, { phone: '09179999999' });
  assert.equal(wrong.status, 404);
  const cancelled = await call('POST', `/api/appointments/${ref}/cancel`, { phone: p.phone });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
  const after = (await call('GET', '/api/doctors/8/availability')).data.dates.find((d) => d.date === day.date).slots.find((s) => s.start === first).remaining;
  assert.equal(after, before + 1, 'the slot is released automatically');

  const again = await call('POST', `/api/appointments/${ref}/cancel`, { phone: p.phone });
  assert.equal(again.status, 409);
  assert.equal(again.data.code, 'ALREADY_CANCELLED');

  const [rows] = await db.query('SELECT n.type, n.status FROM notification n JOIN appointment a ON a.appointment_ID = n.fk_appointment_ID WHERE a.reference_code = ? ORDER BY n.notification_ID', [ref]);
  assert.deepEqual(rows.map((r) => `${r.type}:${r.status}`), ['confirmation:skipped', 'reminder:skipped', 'cancellation:queued']);
});

// ---------- Automation job ----------
test('the notifier sends due messages, leaves future reminders queued, and marks them sent', async () => {
  await db.query("UPDATE notification SET status = 'skipped' WHERE status = 'queued'"); // clean slate
  const dates = (await call('GET', '/api/doctors/9/availability')).data.dates;
  const day = dates[dates.length - 1];
  const r = await call('POST', '/api/appointments', person({ doctorId: 9, date: day.date, start: day.slots[0].start }));
  sms.outbox.length = 0;
  const result = await notifier.processDue();
  assert.equal(result.sent, 1);
  assert.equal(sms.outbox.length, 1);
  assert.ok(sms.outbox[0].message.includes(r.data.reference));
  assert.match(sms.outbox[0].to, /^09\d{9}$/);
  const [rows] = await db.query('SELECT n.type, n.status, n.sent_at FROM notification n JOIN appointment a ON a.appointment_ID = n.fk_appointment_ID WHERE a.reference_code = ? ORDER BY n.type', [r.data.reference]);
  assert.deepEqual(rows.map((x) => `${x.type}:${x.status}`), ['confirmation:sent', 'reminder:queued']);
  assert.ok(rows[0].sent_at);
});

test('a reminder becomes due and is sent when its time arrives', async () => {
  const [[row]] = await db.query("SELECT n.notification_ID FROM notification n WHERE n.type = 'reminder' AND n.status = 'queued' LIMIT 1");
  await db.query("UPDATE notification SET send_at = '2000-01-01 00:00:00' WHERE notification_ID = ?", [row.notification_ID]);
  sms.outbox.length = 0;
  const result = await notifier.processDue();
  assert.ok(result.sent >= 1);
  assert.ok(sms.outbox.some((m) => /reminder|Paalala/i.test(m.message)));
});

test('failed sends are retried and then given up on', async () => {
  const dates = (await call('GET', '/api/doctors/10/availability')).data.dates;
  const r = await call('POST', '/api/appointments', person({ doctorId: 10, date: dates[0].date, start: dates[0].slots[0].start }));
  const original = sms.send;
  require('../services/sms').send = async () => { throw new Error('provider down'); };
  const failing = require('../services/notifier');
  const results = [];
  for (let i = 0; i < 3; i++) results.push(await failing.processDue());
  require('../services/sms').send = original;
  const [[n]] = await db.query("SELECT n.status, n.attempts FROM notification n JOIN appointment a ON a.appointment_ID = n.fk_appointment_ID WHERE a.reference_code = ? AND n.type = 'confirmation'", [r.data.reference]);
  assert.equal(n.status, 'failed');
  assert.equal(n.attempts, 3);
});

// ---------- Staff dashboard ----------
test('staff dashboard needs the token and reports live numbers', async () => {
  assert.equal((await call('GET', '/api/admin/summary')).status, 401);
  assert.equal((await call('GET', '/api/admin/summary', null, { 'x-admin-token': 'wrong' })).status, 401);
  const r = await call('GET', '/api/admin/summary', null, { 'x-admin-token': 'test_token' });
  assert.equal(r.status, 200);
  assert.ok(r.data.stats.total >= 10);
  assert.ok(Array.isArray(r.data.byDepartment) && Array.isArray(r.data.doctorLoad));
  assert.ok(r.data.notifications.recent.every((n) => /^09\d{2}\*\*\*\d{4}$/.test(n.phone)), 'phones are masked');
  const run = await call('POST', '/api/admin/run-notifier', {}, { 'x-admin-token': 'test_token' });
  assert.equal(run.status, 200);
});

test('staff dashboard is off when no token is configured', async () => {
  const saved = process.env.ADMIN_TOKEN;
  delete process.env.ADMIN_TOKEN;
  const r = await call('GET', '/api/admin/summary', null, { 'x-admin-token': '' });
  process.env.ADMIN_TOKEN = saved;
  assert.equal(r.status, 503);
});

// ---------- Staff sign-in and CRUD ----------
let staff = {}; // { Authorization } once signed in
let crud = {}; // ids and slots shared by the staff tests below (they run in order)

test('staff sign-in: wrong password is refused, a good login unlocks the API, tampering is caught', async () => {
  assert.equal((await call('GET', '/api/admin/doctors')).status, 401);
  assert.equal((await call('POST', '/api/admin/login', { username: 'staff', password: 'nope' })).status, 401);
  const login = await call('POST', '/api/admin/login', { username: 'staff', password: 'test_password' });
  assert.equal(login.status, 200);
  assert.ok(login.data.token && login.data.expiresAt > Date.now());
  staff = { Authorization: 'Bearer ' + login.data.token };
  assert.equal((await call('GET', '/api/admin/me', null, staff)).data.user.username, 'staff');
  assert.equal((await call('GET', '/api/admin/doctors', null, { Authorization: 'Bearer ' + login.data.token.slice(0, -3) + 'abc' })).status, 401);
  assert.equal((await call('GET', '/api/admin/doctors', null, { 'x-admin-token': 'test_token' })).status, 200, 'the legacy token still works');
});

test('staff doctors: create, validate, update, deactivate', async () => {
  const bad = await call('POST', '/api/admin/doctors', { doctorName: 'Dr Test', specialization: 'Test', department: 'surgical' }, staff);
  assert.equal(bad.status, 400, 'a department with clinics needs a clinic');
  assert.equal((await call('POST', '/api/admin/doctors', { doctorName: 'Dr Test', specialization: 'Test', department: 'dental', clinic: 'urology' }, staff)).status, 400, 'clinic must belong to the department');

  const made = await call('POST', '/api/admin/doctors', { doctorName: '  Dr   Staff Test ', specialization: 'General Dentistry', department: 'dental' }, staff);
  assert.equal(made.status, 201);
  assert.equal(made.data.name, 'Dr Staff Test');
  assert.equal(made.data.status, 'active');
  crud.doctorId = made.data.id;

  const upd = await call('PUT', `/api/admin/doctors/${crud.doctorId}`, { doctorName: 'Dr Staff Test', specialization: 'Orthodontics', department: 'dental', status: 'active' }, staff);
  assert.equal(upd.data.specialization, 'Orthodontics');

  const list = await call('GET', '/api/admin/doctors?q=Staff%20Test&status=active', null, staff);
  assert.equal(list.data.doctors.length, 1);
});

test('staff schedules: working hours become bookable slots, bad hours are rejected', async () => {
  const id = crud.doctorId;
  // 8:00 to 17:00, one-hour slots, 9 patients a day = exactly 1 patient per slot
  for (let weekday = 0; weekday <= 6; weekday++) {
    const r = await call('PUT', `/api/admin/doctors/${id}/schedule/${weekday}`, { start: '08:00', end: '17:00', slotMinutes: 60, maxPatients: 9 }, staff);
    assert.equal(r.status, 200);
  }
  for (const body of [{ start: '09:00', end: '08:00', slotMinutes: 60, maxPatients: 9 }, { start: '08:00', end: '17:00', slotMinutes: 5, maxPatients: 9 }, { start: '08:00', end: '17:00', slotMinutes: 60, maxPatients: 0 }, { start: '8am', end: '17:00', slotMinutes: 60, maxPatients: 9 }]) {
    assert.equal((await call('PUT', `/api/admin/doctors/${id}/schedule/1`, body, staff)).status, 400);
  }
  const sched = await call('GET', `/api/admin/doctors/${id}/schedule`, null, staff);
  assert.equal(sched.data.schedule.length, 7);

  const open = await call('GET', `/api/doctors/${id}/availability`);
  assert.ok(open.data.dates.length > 0, 'patients can now see slots for this doctor');
  assert.equal(open.data.dates[0].slots[0].remaining, 1);
  crud.slots = open.data.dates[0].slots.map((s) => s.start);
  crud.date = open.data.dates[0].date;

  // updating a day replaces it (no duplicate row), removing a day removes it
  await call('PUT', `/api/admin/doctors/${id}/schedule/3`, { start: '09:00', end: '12:00', slotMinutes: 30, maxPatients: 6 }, staff);
  assert.equal((await call('GET', `/api/admin/doctors/${id}/schedule`, null, staff)).data.schedule.length, 7);
  assert.equal((await call('DELETE', `/api/admin/doctors/${id}/schedule/3`, null, staff)).status, 200);
  assert.equal((await call('GET', `/api/admin/doctors/${id}/schedule`, null, staff)).data.schedule.length, 6);
});

test('staff appointments: create, list, edit details', async () => {
  const phone = nextPhone();
  const made = await call('POST', '/api/admin/appointments', person({ doctorId: crud.doctorId, date: crud.date, start: crud.slots[0], phone, patientName: 'Walk In One' }), staff);
  assert.equal(made.status, 201);
  crud.ref1 = made.data.reference;
  const made2 = await call('POST', '/api/admin/appointments', person({ doctorId: crud.doctorId, date: crud.date, start: crud.slots[1], patientName: 'Walk In Two' }), staff);
  assert.equal(made2.status, 201);
  crud.ref2 = made2.data.reference;

  const list = await call('GET', `/api/admin/appointments?q=${crud.ref1}`, null, staff);
  assert.equal(list.data.total, 1);
  const a = list.data.appointments[0];
  assert.equal(a.phone, phone, 'staff see the full phone number');
  assert.equal(a.start, crud.slots[0]);
  crud.id1 = a.id;
  crud.id2 = (await call('GET', `/api/admin/appointments?q=${crud.ref2}`, null, staff)).data.appointments[0].id;

  const byDoctor = await call('GET', `/api/admin/appointments?doctorId=${crud.doctorId}&status=confirmed`, null, staff);
  assert.equal(byDoctor.data.total, 2);

  assert.equal((await call('PATCH', `/api/admin/appointments/${crud.id1}`, { phone: '123' }, staff)).status, 400);
  assert.equal((await call('PATCH', `/api/admin/appointments/${crud.id1}`, {}, staff)).status, 400);
  const edit = await call('PATCH', `/api/admin/appointments/${crud.id1}`, { patientName: 'Walk In Renamed', language: 'fil' }, staff);
  assert.equal(edit.data.patientName, 'Walk In Renamed');
  assert.equal(edit.data.language, 'fil');
});

test('staff reschedule: a taken slot is refused and nothing changes; a free slot moves the booking', async () => {
  // Appointment 2 holds slot 1. Moving it onto slot 0 (taken by appointment 1) must fail.
  const clash = await call('POST', `/api/admin/appointments/${crud.id2}/reschedule`, { date: crud.date, start: crud.slots[0] }, staff);
  assert.equal(clash.status, 409);
  assert.equal(clash.data.code, 'SLOT_UNAVAILABLE');
  let after = (await call('GET', `/api/admin/appointments/${crud.id2}`, null, staff)).data;
  assert.equal(after.status, 'confirmed', 'a failed reschedule leaves the booking untouched');
  assert.equal(after.start, crud.slots[1]);

  // Moving to the slot it already has is a harmless no-op
  assert.equal((await call('POST', `/api/admin/appointments/${crud.id2}/reschedule`, { date: crud.date, start: crud.slots[1] }, staff)).status, 200);

  // Moving to a free slot works, keeps the reference code, and frees the old slot
  const moved = await call('POST', `/api/admin/appointments/${crud.id2}/reschedule`, { date: crud.date, start: crud.slots[2] }, staff);
  assert.equal(moved.status, 200);
  assert.equal(moved.data.start, crud.slots[2]);
  assert.equal(moved.data.reference, crud.ref2);
  const open = await call('GET', `/api/doctors/${crud.doctorId}/availability`);
  const day = open.data.dates.find((d) => d.date === crud.date);
  assert.ok(day.slots.some((s) => s.start === crud.slots[1]), 'the old slot is free again');
  assert.ok(!day.slots.some((s) => s.start === crud.slots[2]), 'the new slot is now taken');

  // Old reminders are skipped, a fresh confirmation is queued
  const [rows] = await db.query("SELECT type, status FROM notification WHERE fk_appointment_ID = ? ORDER BY notification_ID", [crud.id2]);
  assert.ok(rows.filter((n) => n.type === 'confirmation').length >= 2);
});

test('staff cancel and delete: cancelling keeps the record, deleting removes it, doctors with records cannot be deleted', async () => {
  const cancelled = await call('POST', `/api/admin/appointments/${crud.id1}/cancel`, null, staff);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
  assert.equal((await call('POST', `/api/admin/appointments/${crud.id1}/cancel`, null, staff)).data.code, 'ALREADY_CANCELLED');
  assert.equal((await call('POST', `/api/admin/appointments/${crud.id1}/reschedule`, { date: crud.date, start: crud.slots[4] }, staff)).data.code, 'ALREADY_CANCELLED');

  const blocked = await call('DELETE', `/api/admin/doctors/${crud.doctorId}`, null, staff);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.data.code, 'HAS_APPOINTMENTS');

  assert.equal((await call('DELETE', `/api/admin/appointments/${crud.id1}`, null, staff)).status, 200);
  assert.equal((await call('DELETE', `/api/admin/appointments/${crud.id2}`, null, staff)).status, 200);
  assert.equal((await call('GET', `/api/admin/appointments/${crud.id1}`, null, staff)).status, 404);

  // No records left, so the doctor (and their schedule) can now be removed
  assert.equal((await call('DELETE', `/api/admin/doctors/${crud.doctorId}`, null, staff)).status, 200);
  const [left] = await db.query('SELECT 1 FROM doctor_schedule WHERE fk_doctor_ID = ?', [crud.doctorId]);
  assert.equal(left.length, 0, 'schedule rows are removed with the doctor');
});

test('unknown API routes and bad JSON give clean errors', async () => {
  assert.equal((await call('GET', '/api/nope')).status, 404);
  const res = await fetch(base + '/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  assert.equal(res.status, 400);
});

test('the rate limiter blocks the third request inside its window', () => {
  const limit = require('../middleware/limit');
  const mw = limit({ max: 2, windowMs: 60000 });
  const res = () => ({ code: null, status(c) { this.code = c; return this; }, json() { return this; } });
  let passed = 0;
  const req = { ip: '1.2.3.4' };
  const outcomes = [];
  for (let i = 0; i < 3; i++) { const r = res(); mw(req, r, () => passed++); outcomes.push(r.code); }
  assert.equal(passed, 2);
  assert.equal(outcomes[2], 429);
  const other = res();
  mw({ ip: '5.6.7.8' }, other, () => passed++);
  assert.equal(passed, 3, 'a different visitor is not affected');
});
