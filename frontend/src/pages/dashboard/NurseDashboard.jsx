import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import {
  FiUsers,
  FiLayers,
  FiAlertTriangle,
} from "react-icons/fi";

import {
  statsData,
  bedOccupancy,
} from "../../utils/mockData";


// =========================================================
// NURSE DASHBOARD
// =========================================================

function NurseDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Nurse Dashboard"
        subtitle={`Welcome, ${
          user?.name || "Nurse"
        }. Patient monitoring and bed allocation.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Patients Under Care"
          value={18}
          icon={<FiUsers />}
          color="blue"
        />

        <StatCard
          title="Bed Occupancy"
          value={`${statsData.bedOccupancy}%`}
          icon={<FiLayers />}
          color="green"
        />

        <StatCard
          title="Emergency Cases"
          value={statsData.emergencyCases}
          icon={<FiAlertTriangle />}
          color="red"
        />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Ward Overview
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          Current bed status
        </p>

        <div className="grid grid-cols-2 gap-3">
          {bedOccupancy.slice(0, 4).map((ward) => (
            <div
              key={ward.ward}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <span className="text-sm font-medium">
                {ward.ward}
              </span>

              <span className="text-sm text-gray-500">
                {ward.occupied}/{ward.total} beds
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NurseDashboard;