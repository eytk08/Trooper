// Creates the database and tables, and optionally loads sample data.
//   npm run db:init   empty tables (this RESETS existing data)
//   npm run db:seed   tables, doctors and schedules, plus a few demo bookings
//   npm run db:ensure same as db:seed, but does nothing if the database is already set up (safe on every deploy)
require('../config/env');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const dbName = process.env.DB_NAME || 'trooper';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
ssl: process.env.DB_SSL === 'true'
  ? {
      minVersion: 'TLSv1.2',
      ca: process.env.DB_SSL_CA,
      rejectUnauthorized: true
    }
  : undefined,    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
    await conn.query(`USE \`${dbName}\``);
    if (process.argv.includes('--if-empty')) {
      const [[found]] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = 'department'", [dbName]);
      if (found.n > 0) {
        const [[rows]] = await conn.query('SELECT COUNT(*) AS n FROM department');
        if (rows.n > 0) {
          console.log(`Database "${dbName}" is already set up. Nothing to do.`);
          await conn.end();
          return;
        }
      }
    }
    await conn.query(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
    console.log(`Tables created in "${dbName}".`);
    if (process.argv.includes('--seed')) {
      await conn.query(fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8'));
      console.log('Doctors and schedules loaded.');
    }
  } finally {
    await conn.end();
  }

  if (process.argv.includes('--seed')) {
    // Demo bookings go through the real booking code, so reminders get queued too.
    const db = require('../config/db');
    const scheduling = require('../services/scheduling');
    const demo = [
      ['Sample Veteran One', 'veteran', '09170000001', 1, 0, 0], ['Sample Civilian Two', 'civilian', '09170000002', 1, 0, 0],
      ['Sample Beneficiary Three', 'beneficiary', '09170000003', 3, 0, 1], ['Sample Veteran Four', 'veteran', '09170000004', 20, 0, 2],
      ['Sample Civilian Five', 'civilian', '09170000005', 22, 1, 0], ['Sample Veteran Six', 'veteran', '09170000006', 30, 0, 1],
      ['Sample Beneficiary Seven', 'beneficiary', '09170000007', 12, 1, 1], ['Sample Veteran Eight', 'veteran', '09170000008', 18, 0, 0]
    ];
    let made = 0;
    for (const [name, patientClass, phone, doctorId, dayIdx, slotIdx] of demo) {
      const dates = await scheduling.availability(doctorId);
      const day = dates[Math.min(dayIdx, dates.length - 1)];
      if (!day) continue;
      const slot = day.slots[Math.min(slotIdx, day.slots.length - 1)];
      await scheduling.book({ doctorId, date: day.date, start: slot.start, patientName: name, patientClass, isNewPatient: slotIdx === 0, phone, language: made % 3 === 2 ? 'fil' : 'en' });
      made++;
    }
    console.log(`${made} demo appointments booked.`);
    await db.end();
  }
})().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
