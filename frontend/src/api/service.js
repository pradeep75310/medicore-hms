
import { api } from "./client";

/* =========================================================
 * GENERIC CRUD
 * ========================================================= */

const crud = (base) => ({
  list: (params) =>
    api.get(base, {
      params,
    }),

  get: (id) => api.get(`${base}${id}/`),

  create: (data) => api.post(base, data),

  update: (id, data) => api.patch(`${base}${id}/`, data),

  remove: (id) => api.delete(`${base}${id}/`),
});

/* =========================================================
 * AUTH
 * ========================================================= */

export const authApi = {
  login: api.login,

  me: api.getCurrentUser,

  logout: api.logout,

  patientRegister: (data) => api.post("/accounts/patient/register/", data),

  forgotPassword: (email) => api.post("/accounts/forgot-password/", { email }),

  resetPassword: (data) => api.post("/accounts/reset-password/", data),

  superuserRequestOtp: (data) =>
    api.post("/accounts/superuser/request-otp/", data),

  superuserRegister: (data) => api.post("/accounts/superuser/register/", data),

  hospitalAdminCreate: (data) =>
    api.post("/accounts/hospital-admin/create/", data),

  hospitalAdminVerifyOtp: (data) =>
    api.post("/accounts/hospital-admin/verify-otp/", data),

  hospitalAdminApprove: (id, data = {}) =>
    api.patch(`/accounts/hospital-admin/${id}/approve/`, data),

  hospitalAdminResendOtp: (id) =>
    api.post(`/accounts/hospital-admin/${id}/resend-otp/`),

  hospitalAdmins: (params) => api.get("/accounts/hospital-admins/", { params }),
  

  // Get single Hospital Admin
  hospitalAdminGet: (id) =>
    api.get(`/accounts/hospital-admin/${id}/`),

  // Edit Hospital Admin
  hospitalAdminUpdate: (id, data) =>
    api.patch(`/accounts/hospital-admin/${id}/`, data),

  // Activate / Deactivate Hospital Admin
  hospitalAdminSetStatus: (id, is_active) =>
    api.patch(`/accounts/hospital-admin/${id}/status/`, {
      is_active,
    }),

  // Permanently delete Hospital Admin
  hospitalAdminDelete: (id) =>
    api.delete(`/accounts/hospital-admin/${id}/delete/`),
};


export const patientApi = {
  // Patient list
  list: (params) =>
    api.get("/patients/", { params }),

  // Patient details
  get: (id) =>
    api.get(`/patients/${id}/`),

  // Create patient
  create: (data) =>
    api.post("/patients/", data, { skipAuth: true }),

  // Create patient account
  createAccount: (data) =>
    api.post("/patients/create-account/", data),

  // Complete/update patient registration
  completeRegistration: (id, data) =>
    api.patch(`/patients/${id}/complete-registration/`, data),
  
  update: (id, data) =>
    api.patch(`/patients/${id}/complete-registration/`, data),

  // Activate/deactivate patient
  setStatus: (id, isActive) =>
    api.patch(`/patients/${id}/status/`, {
      is_active: isActive,
    }),

  // Archive patient instead of permanently deleting
  archive: (id, reason = "") =>
    api.post(`/patients/${id}/archive/`, {
      reason,
    }),

  // Patient OTP verification
  verifypatOTP: (data) =>
    api.post("/accounts/patient/verify-otp/", data, {
      skipAuth: true,
    }),
 
  remove: (id) =>
    api.delete(`/patients/${id}/`),
};
/* =========================================================
 * HOSPITALS
 * ========================================================= */

export const hospitalApi = {
  list: (params) => api.get("/hospitals/hospitals/", { params  , skipAuth: true,}),

  get: (id) => api.get(`/hospitals/hospitals/${id}/`),

  create: (data) => api.post("/hospitals/hospitals/", data),

  update: (id, data) => api.patch(`/hospitals/hospitals/${id}/`, data),

  remove: (id) => api.delete(`/hospitals/hospitals/${id}/`),
};

/* =========================================================
 * ORGANIZATION
 * ========================================================= */

export const branchApi = crud("/branches/");

export const departmentApi = crud("/departments/");

/* =========================================================
 * STAFF / CLINICAL
 * ========================================================= */

// export const doctorApi = crud("/doctors/");
export const doctorApi = {
  ...crud("/doctors/"),

  createAccount: (data) =>
    api.post("/accounts/staff/create/", data),

  completeRegistration: (id, data) =>
    api.patch(`/doctors/${id}/`, data),

  setStatus: (id, is_active) =>
    api.patch(`/accounts/staff/${id}/status/`, { is_active }),

  remove: (id) =>
    api.delete(`/doctors/${id}/`),
};

export const nurseApi = crud("/nurses/");

/* =========================================================
 * APPOINTMENTS
 * ========================================================= */

export const appointmentService = {
  list(params = {}) {
    return api.get("/appointments/", { params });
  },

  getLookups(params = {}) {
    return api.get("/appointments/lookups/", { params });
  },

  create(payload) {
    return api.post("/appointments/", payload);
  },

  cancel(appointmentId, payload = {}) {
    return api.post(`/appointments/${appointmentId}/cancel/`, payload);
  },

  reschedule(appointmentId, payload) {
    return api.post(`/appointments/${appointmentId}/reschedule/`, payload);
  },

  updateStatus(appointmentId, payload) {
    return api.patch(`/appointments/${appointmentId}/status/`, payload);
  },
};

/* =========================================================
 * LABORATORY
 * ========================================================= */

export const labApi = crud("/laboratory/");

/* =========================================================
 * PHARMACY
 * ========================================================= */

export const medicineApi = crud("/pharmacy/medicines/");

export const prescriptionApi = crud("/pharmacy/prescriptions/");

/* =========================================================
 * BILLING
 * ========================================================= */

export const billingApi = crud("/billing/");

/* =========================================================
 * EMR
 * ========================================================= */

export const emrApi = crud("/emr/");

/* =========================================================
 * IPD
 * ========================================================= */

export const ipdApi = crud("/ipd/");

/* =========================================================
 * EMERGENCY
 * ========================================================= */

export const emergencyApi = crud("/emergency/");

/* =========================================================
 * TELEMEDICINE
 * ========================================================= */

export const telemedicineApi = crud("/telemedicine/");

/* =========================================================
 * STAFF MANAGEMENT
 * ========================================================= */

export const staffApi = {
  list: (params) => api.get("/accounts/staff/", { params }),

  create: (data) => api.post("/accounts/staff/create/", data),

  get: (id) => api.get(`/accounts/staff/${id}/`),

  update: (id, data) => api.patch(`/accounts/staff/${id}/`, data),

  setStatus: (id, is_active) =>
    api.patch(`/accounts/staff/${id}/status/`, {
      is_active,
    }),
  
  remove: (id) => api.delete(`/accounts/staff/${id}/`),
  hospitalAdmins: (params) => api.get("/accounts/hospital-admins/", { params }),
};

/* =========================================================
 * DASHBOARD HELPERS
 * ========================================================= */

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  return [];
};

const getNextUrl = (payload) => {
  return payload?.next || payload?.data?.next || null;
};

const getAllPages = async (listMethod, params = {}) => {
  let payload = await listMethod(params);

  let items = [...normalizeList(payload)];

  let next = getNextUrl(payload);

  const seen = new Set();

  while (next && !seen.has(next)) {
    seen.add(next);

    payload = await api.get(next);

    items = [...items, ...normalizeList(payload)];

    next = getNextUrl(payload);
  }

  return items;
};

export const dashboardApi = {
  patients: (params) =>
    getAllPages(patientApi.list, params),

  hospitals: (params) =>
    getAllPages(hospitalApi.list, params),

  branches: (params) =>
    getAllPages(branchApi.list, params),

  departments: (params) =>
    getAllPages(departmentApi.list, params),

  doctors: (params) =>
    getAllPages(doctorApi.list, params),

  nurses: (params) =>
    getAllPages(nurseApi.list, params),

  appointments: (params) =>
    getAllPages(appointmentService.list, params),

  billing: (params) =>
    getAllPages(billingApi.list, params),

  staff: (params) =>
    getAllPages(staffApi.list, params),
};

/* =========================================================
 * DEFAULT EXPORT
 * ========================================================= */

export default {
  api,

  authApi,

  patientApi,
  hospitalApi,

  branchApi,
  departmentApi,

  doctorApi,
  nurseApi,
  dashboardApi,

  appointmentService,

  labApi,

  medicineApi,
  prescriptionApi,

  billingApi,

  emrApi,

  ipdApi,

  emergencyApi,

  telemedicineApi,


  staffApi,
};
