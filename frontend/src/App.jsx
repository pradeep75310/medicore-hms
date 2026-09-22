import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Analytics from './pages/dashboard/Analytics';
import Patients from './pages/patients/Patients';
import PatientRegister from './pages/patients/PatientRegister';
import Appointments from './pages/appointments/Appointments';
import Doctors from './pages/doctors/Doctors';
import EMR from './pages/emr/EMR';
import Telemedicine from './pages/telemedicine/Telemedicine';
import Laboratory from './pages/laboratory/Laboratory';
import Pharmacy from './pages/pharmacy/Pharmacy';
import Billing from './pages/billing/Billing';
import IPD from './pages/ipd/IPD';
import Emergency from './pages/emergency/Emergency';
import HR from './pages/hr/HR';
import Inventory from './pages/inventory/Inventory';
import AIFeatures from './pages/ai/AIFeatures';

// Roles that always get full access, per the PDF (section 3):
// Super Admin -> Complete System Access. Hospital Admin -> Manage Hospital Operations / Departments / Reports.
const FULL_ACCESS_ROLES = ['super_admin', 'hospital_admin'];

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector(state => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isFullAccess = FULL_ACCESS_ROLES.includes(role);
  const isAllowed = isFullAccess || !allowedRoles || allowedRoles.includes(role);

  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Every role has a Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Doctor: Patient Consultation, Prescription Management, EMR Access */}
      <Route path="/appointments" element={<ProtectedRoute allowedRoles={['doctor', 'receptionist', 'patient']}><Appointments /></ProtectedRoute>} />
      <Route path="/emr" element={<ProtectedRoute allowedRoles={['doctor', 'patient']}><EMR /></ProtectedRoute>} />
      <Route path="/telemedicine" element={<ProtectedRoute allowedRoles={['doctor', 'patient']}><Telemedicine /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute allowedRoles={['doctor', 'receptionist']}><Doctors /></ProtectedRoute>} />

      {/* Receptionist: Patient Registration, Appointment Scheduling */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['receptionist', 'nurse']}><Patients /></ProtectedRoute>} />
      <Route path="/patients/register" element={<ProtectedRoute allowedRoles={['receptionist']}><PatientRegister /></ProtectedRoute>} />

      {/* Nurse: Patient Monitoring, Bed Allocation */}
      <Route path="/ipd" element={<ProtectedRoute allowedRoles={['nurse']}><IPD /></ProtectedRoute>} />
      <Route path="/emergency" element={<ProtectedRoute allowedRoles={['nurse']}><Emergency /></ProtectedRoute>} />

      {/* Lab Technician: Manage Tests, Upload Reports */}
      <Route path="/laboratory" element={<ProtectedRoute allowedRoles={['lab_technician', 'doctor']}><Laboratory /></ProtectedRoute>} />

      {/* Pharmacist: Inventory Control, Medicine Billing */}
      <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['pharmacist']}><Pharmacy /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={['pharmacist']}><Inventory /></ProtectedRoute>} />

      {/* Accountant: Billing, Revenue Tracking */}
      <Route path="/billing" element={<ProtectedRoute allowedRoles={['accountant']}><Billing /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={['accountant']}><Analytics /></ProtectedRoute>} />

      {/* Super Admin / Hospital Admin only */}
      <Route path="/hr" element={<ProtectedRoute allowedRoles={[]}><HR /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute allowedRoles={[]}><AIFeatures /></ProtectedRoute>} />

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