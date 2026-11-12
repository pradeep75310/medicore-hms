import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";
import MainLayout from "./components/layout/MainLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Analytics from "./pages/dashboard/Analytics";
import Patients from "./pages/patients/Patients";
import Appointments from "./pages/appointments/Appointments";
import Doctors from "./pages/doctors/Doctors";
import Nurses from "./pages/nurses/Nurses";
import EMR from "./pages/emr/EMR";
import Telemedicine from "./pages/telemedicine/Telemedicine";
import Laboratory from "./pages/laboratory/Laboratory";
import Pharmacy from "./pages/pharmacy/Pharmacy";
import Billing from "./pages/billing/Billing";
import IPD from "./pages/ipd/IPD";
import Emergency from "./pages/emergency/Emergency";
import HR from "./pages/hr/HR";
import Inventory from "./pages/inventory/Inventory";
import HospitalManagement from "./pages/admin/HospitalManagement";
import BranchManagement from "./pages/admin/BranchManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import HospitalAdminManagement from "./pages/admin/HospitalAdminManagement";
import SuperUserRegister from "./pages/auth/SuperUserRegister";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import PatientDetails from "./pages/patients/PatientDetails";
import Profile from "./pages/profile/Profile";

const FULL_ACCESS_ROLES = ["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"];

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const currentRole = (role || "").toUpperCase();
  const isFullAccess = FULL_ACCESS_ROLES.some(
    (r) => r.toUpperCase() === currentRole,
  );
  const isAllowed =
    isFullAccess ||
    !allowedRoles ||
    allowedRoles.length === 0 ||
    allowedRoles.some((r) => r.toUpperCase() === currentRole);

  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/superuser/register" element={<SuperUserRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Every role has a Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/profile" element={<Profile />} />

      {/* Doctor: Patient Consultation, Prescription Management, EMR Access */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute
            allowedRoles={[
              "SUPER_USER",
              "SUPER_ADMIN",
              "HOSPITAL_ADMIN",
              "doctor",
              "receptionist",
              "patient",
            ]}
          >
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emr"
        element={
          <ProtectedRoute allowedRoles={["doctor", "patient"]}>
            <EMR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemedicine"
        element={
          <ProtectedRoute allowedRoles={["doctor", "patient"]}>
            <Telemedicine />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <ProtectedRoute allowedRoles={["doctor", "receptionist"]}>
            <Doctors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nurses"
        element={
          <ProtectedRoute allowedRoles={["nurse", "receptionist"]}>
            <Nurses />
          </ProtectedRoute>
        }
      />

      {/* Receptionist: Patient Registration, Appointment Scheduling */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={["receptionist", "nurse"]}>
            <Patients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:patientId"
        element={
          <ProtectedRoute allowedRoles={["receptionist", "nurse"]}>
            <PatientDetails />
          </ProtectedRoute>
        }
      />
      {/* Nurse: Patient Monitoring, Bed Allocation */}
      <Route
        path="/ipd"
        element={
          <ProtectedRoute allowedRoles={["nurse"]}>
            <IPD />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute allowedRoles={["nurse"]}>
            <Emergency />
          </ProtectedRoute>
        }
      />

      {/* Lab Technician: Manage Tests, Upload Reports */}
      <Route
        path="/laboratory"
        element={
          <ProtectedRoute allowedRoles={["lab_technician", "doctor"]}>
            <Laboratory />
          </ProtectedRoute>
        }
      />

      {/* Pharmacist: Inventory Control, Medicine Billing */}
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={["pharmacist"]}>
            <Pharmacy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={["pharmacist"]}>
            <Inventory />
          </ProtectedRoute>
        }
      />

      {/* Accountant: Billing, Revenue Tracking */}
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={["accountant"]}>
            <Billing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={["accountant"]}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Super Admin / Hospital Admin only */}
      <Route
        path="/hospitals"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <HospitalManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branches"
        element={
          <ProtectedRoute
            allowedRoles={["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"]}
          >
            <BranchManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute
            allowedRoles={["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"]}
          >
            <DepartmentManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital-admins"
        element={
          <ProtectedRoute allowedRoles={["SUPER_USER", "SUPER_ADMIN"]}>
            <HospitalAdminManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute allowedRoles={[]}>
            <HR />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </Provider>
  );
}
