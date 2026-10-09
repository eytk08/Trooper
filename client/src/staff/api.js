import { MOCK_STAFF_USER, MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_STATS } from './mockData';

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchCurrentUser() {
  await delay();
  return MOCK_STAFF_USER;
}

export async function loginStaff() {
  await delay();
  return { success: true, user: MOCK_STAFF_USER };
}

export async function logoutStaff() {
  await delay();
  return { success: true };
}

export async function fetchOverviewStats() {
  await delay();
  return MOCK_STATS;
}

export async function fetchAppointments() {
  await delay();
  return MOCK_APPOINTMENTS;
}

export async function fetchDoctors() {
  await delay();
  return MOCK_DOCTORS;
}

export async function updateAppointmentStatus(id, status) {
  await delay();
  return { success: true, id, status };
}

export async function cancelAppointment(id) {
  await delay();
  return { success: true, id };
}

// Staff API object
export const staffApi = {
  me: fetchCurrentUser,
  login: loginStaff,
  logout: logoutStaff,
  getOverview: fetchOverviewStats,
  getAppointments: fetchAppointments,
  getDoctors: fetchDoctors,
  updateAppointment: updateAppointmentStatus,
  cancelAppointment: cancelAppointment,
  fetchCurrentUser,
  loginStaff,
  logoutStaff,
  fetchOverviewStats,
  fetchAppointments,
  fetchDoctors,
  updateAppointmentStatus,
};

// Public API object used by modals for lookups/slots
export const publicApi = {
  getDoctors: fetchDoctors,
  getSlots: async () => {
    await delay();
    return ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'];
  },
  bookAppointment: async (payload) => {
    await delay();
    return { success: true, reference_code: 'TRP-' + Math.floor(1000 + Math.random() * 9000), ...payload };
  },
  cancelAppointment: cancelAppointment,
};

export default staffApi;