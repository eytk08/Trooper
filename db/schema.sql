-- Trooper schema (MySQL 8 or MariaDB 10.5+)
-- Running this file resets all tables. Use npm run db:init to run it.

DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS doctor_schedule;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS clinic;
DROP TABLE IF EXISTS department;

-- A department may have clinics (Surgical has Urology, Minor Surgery, ...) or none (Dental).
CREATE TABLE department (
  department_ID INT         NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(40) NOT NULL,
  name          VARCHAR(60) NOT NULL,
  name_fil      VARCHAR(60) NOT NULL,
  sort_order    TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (department_ID),
  UNIQUE KEY uq_department_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clinic (
  clinic_ID        INT         NOT NULL AUTO_INCREMENT,
  fk_department_ID INT         NOT NULL,
  slug             VARCHAR(40) NOT NULL,
  name             VARCHAR(60) NOT NULL,
  name_fil         VARCHAR(60) NOT NULL,
  sort_order       TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (clinic_ID),
  UNIQUE KEY uq_clinic_slug (fk_department_ID, slug),
  CONSTRAINT fk_clinic_department FOREIGN KEY (fk_department_ID) REFERENCES department (department_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE doctor (
  doctor_ID        INT          NOT NULL AUTO_INCREMENT,
  doctorName       VARCHAR(80)  NOT NULL,
  specialization   VARCHAR(80)  NOT NULL,
  fk_department_ID INT          NOT NULL,
  fk_clinic_ID     INT          DEFAULT NULL,
  status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (doctor_ID),
  KEY idx_doctor_department (fk_department_ID, fk_clinic_ID, status),
  CONSTRAINT fk_doctor_department FOREIGN KEY (fk_department_ID) REFERENCES department (department_ID),
  CONSTRAINT fk_doctor_clinic     FOREIGN KEY (fk_clinic_ID)     REFERENCES clinic (clinic_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per doctor per working weekday. Slots are NOT stored. They are generated from
-- start_time, end_time and slot_minutes, so changing a schedule changes availability at once.
CREATE TABLE doctor_schedule (
  schedule_ID  INT      NOT NULL AUTO_INCREMENT,
  fk_doctor_ID INT      NOT NULL,
  weekday      TINYINT  NOT NULL COMMENT '0 = Sunday ... 6 = Saturday',
  start_time   TIME     NOT NULL,
  end_time     TIME     NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 60,
  max_patients SMALLINT NOT NULL COMMENT 'daily limit for this doctor',
  PRIMARY KEY (schedule_ID),
  UNIQUE KEY uq_schedule_day (fk_doctor_ID, weekday),
  CONSTRAINT fk_schedule_doctor FOREIGN KEY (fk_doctor_ID) REFERENCES doctor (doctor_ID) ON DELETE CASCADE,
  CONSTRAINT chk_schedule_weekday CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_schedule_times   CHECK (end_time > start_time),
  CONSTRAINT chk_schedule_slot    CHECK (slot_minutes BETWEEN 10 AND 240),
  CONSTRAINT chk_schedule_max     CHECK (max_patients > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE appointment (
  appointment_ID   INT          NOT NULL AUTO_INCREMENT,
  reference_code   VARCHAR(20)  NOT NULL,
  fk_doctor_ID     INT          NOT NULL,
  appointment_date DATE         NOT NULL,
  slot_start       TIME         NOT NULL,
  patient_name     VARCHAR(80)  NOT NULL,
  patient_class    ENUM('veteran','beneficiary','civilian') NOT NULL,
  is_new_patient   TINYINT(1)   NOT NULL,
  contact_phone    VARCHAR(20)  NOT NULL,
  language         ENUM('en','fil') NOT NULL DEFAULT 'en',
  status           ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at     TIMESTAMP    NULL DEFAULT NULL,
  PRIMARY KEY (appointment_ID),
  UNIQUE KEY uq_appt_ref (reference_code),
  KEY idx_appt_slot (fk_doctor_ID, appointment_date, slot_start, status),
  KEY idx_appt_phone (contact_phone),
  KEY idx_appt_date (appointment_date),
  CONSTRAINT fk_appt_doctor FOREIGN KEY (fk_doctor_ID) REFERENCES doctor (doctor_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The automation queue. Booking and cancelling add rows. A background job sends the due ones.
CREATE TABLE notification (
  notification_ID   INT          NOT NULL AUTO_INCREMENT,
  fk_appointment_ID INT          NOT NULL,
  type              ENUM('confirmation','reminder','cancellation') NOT NULL,
  message           VARCHAR(500) NOT NULL,
  send_at           DATETIME     NOT NULL,
  status            ENUM('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
  attempts          TINYINT      NOT NULL DEFAULT 0,
  sent_at           DATETIME     DEFAULT NULL,
  PRIMARY KEY (notification_ID),
  KEY idx_notification_due (status, send_at),
  KEY idx_notification_appt (fk_appointment_ID),
  CONSTRAINT fk_notification_appt FOREIGN KEY (fk_appointment_ID) REFERENCES appointment (appointment_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
