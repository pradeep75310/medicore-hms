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

const FULL_ACCESS_ROLES = [
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'BRANCH_ADMIN',
];

function ProtectedRoute({ children, allowedRoles = null, strict = false }) {
  const auth = useSelector((state) => state.auth);

  const isAuthenticated = auth?.isAuthenticated;
  const role = auth?.role;

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Full-access admin roles
  const isFullAccess =
    !strict && FULL_ACCESS_ROLES.includes(role);

  // Check role
  const isAllowed =
    isFullAccess ||
    allowedRoles === null ||
    allowedRoles.includes(role);

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />
      </Router>
    </Provider>
  );
}
