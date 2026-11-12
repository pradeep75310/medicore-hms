import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import { FiUsers, FiCalendar, FiClock, FiAlertTriangle } from "react-icons/fi";

import { statsData } from "../../utils/mockData";

// =========================================================
// RECEPTIONIST DASHBOARD
// =========================================================

function ReceptionistDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Front Desk"
        subtitle={`Welcome, ${user?.name || "Receptionist"}.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Today's Registrations"
          value={12}
          icon={<FiUsers />}
          color="blue"
        />

        <StatCard
          title="Appointments Today"
          value={statsData.todayAppointments}
          icon={<FiCalendar />}
          color="green"
        />

        <StatCard
          title="Waiting Now"
          value={7}
          icon={<FiClock />}
          color="orange"
        />

        <StatCard
          title="Emergency Cases"
          value={statsData.emergencyCases}
          icon={<FiAlertTriangle />}
          color="red"
        />
      </div>
    </div>
  );
}

export default ReceptionistDashboard;
