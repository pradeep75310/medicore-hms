
import React from "react";
import { useSelector } from "react-redux";

import SuperUserDashboard from "./SuperUserDashboard";
import HospitalAdminDashboard from "./HospitalAdminDashboard";

import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";
import ReceptionistDashboard from "./ReceptionistDashboard";
import NurseDashboard from "./NurseDashboard";
import LabTechnicianDashboard from "./LabTechnicianDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import AccountantDashboard from "./AccountantDashboard";


export default function Dashboard() {
  const { role, user } = useSelector((state) => state.auth);
  
  const normalizedRole = String(role || user?.role || "").toUpperCase();

  switch (normalizedRole) {
    /* =========================================================
       SUPER USER
       ========================================================= */
    case "SUPER_USER":
      return <SuperUserDashboard user={user} />;

    /* =========================================================
       HOSPITAL ADMIN
       ========================================================= */
    case "HOSPITAL_ADMIN":
      return <HospitalAdminDashboard user={user} />;

      

    /* =========================================================
       DOCTOR
       ========================================================= */
    case "DOCTOR":
      return <DoctorDashboard user={user} />;

    /* =========================================================
       PATIENT
       ========================================================= */
    case "PATIENT":
      return <PatientDashboard user={user} />;

    /* =========================================================
       RECEPTIONIST
       ========================================================= */
    case "RECEPTIONIST":
      return <ReceptionistDashboard user={user} />;

    /* =========================================================
       NURSE
       ========================================================= */
    case "NURSE":
      return <NurseDashboard user={user} />;

    /* =========================================================
       LAB TECHNICIAN
       ========================================================= */
    case "LAB_TECHNICIAN":
      return <LabTechnicianDashboard user={user} />;

    /* =========================================================
       PHARMACIST
       ========================================================= */
    case "PHARMACIST":
      return <PharmacistDashboard user={user} />;

    /* =========================================================
       ACCOUNTANT
       ========================================================= */
    case "ACCOUNTANT":
      return <AccountantDashboard user={user} />;

    /* =========================================================
       UNKNOWN / INVALID ROLE
       ========================================================= */
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Access Denied
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Your account does not have a valid dashboard role.
            </p>
          </div>
        </div>
      );
  }
}