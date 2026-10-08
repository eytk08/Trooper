-- Trooper reporting queries, simple to difficult.
-- Run after loading sample data:  mysql -u root -p trooper < db/queries.sql

-- ===== SIMPLE =====

-- 1. Doctors who work on Mondays, with their hours
SELECT d.doctorName, s.start_time, s.end_time, s.max_patients
FROM doctor_schedule AS s
JOIN doctor AS d ON d.doctor_ID = s.fk_doctor_ID
WHERE s.weekday = 1
ORDER BY s.start_time, d.doctorName;

-- 2. Clinics inside each department
SELECT dep.name AS department, GROUP_CONCAT(c.name ORDER BY c.sort_order SEPARATOR ', ') AS clinics
FROM department AS dep
JOIN clinic AS c ON c.fk_department_ID = dep.department_ID
GROUP BY dep.department_ID, dep.name
ORDER BY dep.sort_order;

-- ===== MODERATE =====

-- 3. Upcoming confirmed appointments per department
SELECT dep.name AS department, COUNT(*) AS booked
FROM appointment AS a
JOIN doctor     AS d   ON d.doctor_ID = a.fk_doctor_ID
JOIN department AS dep ON dep.department_ID = d.fk_department_ID
WHERE a.status = 'confirmed' AND a.appointment_date >= CURDATE()
GROUP BY dep.department_ID, dep.name
ORDER BY booked DESC;

-- 4. Slots with two or more patients
SELECT d.doctorName, a.appointment_date, a.slot_start, COUNT(*) AS patients
FROM appointment AS a
JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
WHERE a.status = 'confirmed'
GROUP BY d.doctor_ID, d.doctorName, a.appointment_date, a.slot_start
HAVING COUNT(*) >= 2
ORDER BY a.appointment_date, a.slot_start;

-- 5. Cancellation rate by patient class
SELECT patient_class,
       COUNT(*) AS total,
       SUM(status = 'cancelled') AS cancelled,
       ROUND(100 * SUM(status = 'cancelled') / COUNT(*), 1) AS cancel_pct
FROM appointment
GROUP BY patient_class;

-- 6. First time versus returning patients per department
SELECT dep.name AS department,
       SUM(a.is_new_patient = 1) AS new_patients,
       SUM(a.is_new_patient = 0) AS returning_patients
FROM appointment AS a
JOIN doctor     AS d   ON d.doctor_ID = a.fk_doctor_ID
JOIN department AS dep ON dep.department_ID = d.fk_department_ID
GROUP BY dep.department_ID, dep.name
ORDER BY dep.name;

-- ===== DIFFICULT =====

-- 7. How full is each doctor's day? Booked patients against the daily limit.
--    DAYOFWEEK() starts at 1 for Sunday, so subtract 1 to match doctor_schedule.weekday.
SELECT d.doctorName, a.appointment_date, COUNT(*) AS booked, s.max_patients,
       ROUND(100 * COUNT(*) / s.max_patients) AS pct_full
FROM appointment AS a
JOIN doctor          AS d ON d.doctor_ID = a.fk_doctor_ID
JOIN doctor_schedule AS s ON s.fk_doctor_ID = a.fk_doctor_ID AND s.weekday = DAYOFWEEK(a.appointment_date) - 1
WHERE a.status = 'confirmed'
GROUP BY d.doctor_ID, d.doctorName, a.appointment_date, s.max_patients
ORDER BY pct_full DESC, a.appointment_date;

-- 8. Rank doctors by bookings inside their own department (window function)
SELECT department, doctorName, booked,
       RANK() OVER (PARTITION BY department ORDER BY booked DESC) AS rank_in_department
FROM (
  SELECT dep.name AS department, d.doctorName, COUNT(a.appointment_ID) AS booked
  FROM doctor AS d
  JOIN department AS dep ON dep.department_ID = d.fk_department_ID
  LEFT JOIN appointment AS a ON a.fk_doctor_ID = d.doctor_ID AND a.status = 'confirmed'
  GROUP BY dep.department_ID, dep.name, d.doctor_ID, d.doctorName
) AS per_doctor
ORDER BY department, rank_in_department, doctorName;

-- 9. Active doctors with no bookings at all (LEFT JOIN ... IS NULL)
SELECT d.doctorName, d.specialization
FROM doctor AS d
LEFT JOIN appointment AS a ON a.fk_doctor_ID = d.doctor_ID AND a.status = 'confirmed'
WHERE d.status = 'active' AND a.appointment_ID IS NULL
ORDER BY d.doctorName
LIMIT 10;

-- 10. Phone numbers holding more than one active appointment (subquery)
SELECT a.contact_phone, a.reference_code, d.doctorName, a.appointment_date, a.slot_start
FROM appointment AS a
JOIN doctor AS d ON d.doctor_ID = a.fk_doctor_ID
WHERE a.status = 'confirmed'
  AND a.contact_phone IN (
        SELECT contact_phone FROM appointment WHERE status = 'confirmed'
        GROUP BY contact_phone HAVING COUNT(*) > 1)
ORDER BY a.contact_phone, a.appointment_date;

-- ===== AUTOMATION HEALTH =====

-- 11. Message delivery summary
SELECT type, status, COUNT(*) AS messages
FROM notification
GROUP BY type, status
ORDER BY type, status;

-- 12. Messages that are overdue, which means the background job may have stopped
SELECT n.notification_ID, n.type, n.send_at, a.reference_code
FROM notification AS n
JOIN appointment AS a ON a.appointment_ID = n.fk_appointment_ID
WHERE n.status = 'queued' AND n.send_at < NOW() - INTERVAL 5 MINUTE
ORDER BY n.send_at;
