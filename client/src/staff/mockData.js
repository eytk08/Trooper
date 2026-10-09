export const MOCK_STAFF_USER = {
  id: 1,
  name: 'Dr. Alex Rivera',
  email: 'staff@example.com',
  role: 'admin',
  clinic_name: 'General Clinic',
};

export const MOCK_APPOINTMENTS = [
  {
    id: 101,
    patient_name: 'Maria Santos',
    contact_number: '0917-123-4567',
    doctor_name: 'Dr. Jose Ramirez',
    specialty: 'Cardiology',
    appointment_date: '2026-10-12',
    time_slot: '09:00 AM',
    status: 'Confirmed',
    reference_code: 'TRP-8841',
  },
  {
    id: 102,
    patient_name: 'Juan Dela Cruz',
    contact_number: '0918-555-0199',
    doctor_name: 'Dr. Elena Rostova',
    specialty: 'Pediatrics',
    appointment_date: '2026-10-12',
    time_slot: '10:30 AM',
    status: 'Pending',
    reference_code: 'TRP-9102',
  },
  {
    id: 103,
    patient_name: 'Camille Reyes',
    contact_number: '0922-334-9081',
    doctor_name: 'Dr. Jose Ramirez',
    specialty: 'Cardiology',
    appointment_date: '2026-10-13',
    time_slot: '02:00 PM',
    status: 'Completed',
    reference_code: 'TRP-7723',
  },
  {
    id: 104,
    patient_name: 'Rico Bautista',
    contact_number: '0995-441-2800',
    doctor_name: 'Dr. Michael Chen',
    specialty: 'General Medicine',
    appointment_date: '2026-10-14',
    time_slot: '11:15 AM',
    status: 'Cancelled',
    reference_code: 'TRP-6512',
  },
];

export const MOCK_DOCTORS = [
  {
    id: 1,
    name: 'Dr. Jose Ramirez',
    specialty: 'Cardiology',
    room: 'Room 302',
    schedule_days: 'Mon, Wed, Fri',
    active: true,
  },
  {
    id: 2,
    name: 'Dr. Elena Rostova',
    specialty: 'Pediatrics',
    room: 'Room 205',
    schedule_days: 'Tue, Thu, Sat',
    active: true,
  },
  {
    id: 3,
    name: 'Dr. Michael Chen',
    specialty: 'General Medicine',
    room: 'Room 101',
    schedule_days: 'Mon-Fri',
    active: true,
  },
];

export const MOCK_STATS = {
  totalAppointments: 48,
  confirmedToday: 8,
  pendingReview: 3,
  activeDoctors: 3,
};