const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function seed() {
  try {
    console.log('Connecting to database...');

    // 1. Fetch or insert doctor
    let [doctors] = await db.query('SELECT doctor_ID, doctorName FROM doctor LIMIT 2');
    let docId;

    if (!doctors || doctors.length === 0) {
      console.log('No doctor found, inserting sample doctor...');
      const [res] = await db.query(`
        INSERT INTO doctor (doctorName, specialization, status)
        VALUES ('Dr. Sarah Jenkins', 'General Physician', 'active')
      `);
      docId = res.insertId;
    } else {
      docId = doctors[0].doctor_ID;
    }

    // 2. Insert sample appointments matching the exact columns
    console.log('Inserting sample appointments...');
    const appointments = [
      ['APT-1001', docId, '2026-10-10', '09:00:00', 'Juan dela Cruz', 'Adult', 0, '09171234567', 'en', 'confirmed'],
      ['APT-1002', docId, '2026-10-11', '10:30:00', 'Maria Santos', 'Adult', 1, '09189876543', 'tl', 'confirmed'],
      ['APT-1003', docId, '2026-10-12', '14:00:00', 'Carlos Garcia', 'Senior', 0, '09205551234', 'en', 'confirmed'],
      ['APT-1004', docId, '2026-10-08', '11:00:00', 'Elena Ramos', 'Adult', 1, '09223334455', 'tl', 'cancelled'],
      ['APT-1005', docId, '2026-10-13', '15:30:00', 'Ricardo Dalisay', 'Adult', 0, '09170001122', 'en', 'confirmed']
    ];

    for (const apt of appointments) {
      await db.query(`
        INSERT INTO appointment 
          (reference_code, fk_doctor_ID, appointment_date, slot_start, patient_name, patient_class, is_new_patient, contact_phone, language, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `, apt);
    }

    console.log('Successfully seeded appointments!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();