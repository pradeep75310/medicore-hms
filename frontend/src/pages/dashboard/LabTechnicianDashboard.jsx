import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import {
  FiDroplet,
  FiFileText,
  FiClock,
} from "react-icons/fi";

import { statsData } from "../../utils/mockData";


// =========================================================
// LAB TECHNICIAN DASHBOARD
// =========================================================

function LabTechnicianDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Lab Dashboard"
        subtitle={`Welcome, ${
          user?.name || "Lab Technician"
        }. Manage tests and upload reports.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Tests Today"
          value={statsData.labTestsToday}
          icon={<FiDroplet />}
          color="blue"
        />

        <StatCard
          title="Pending Reports"
          value={6}
          icon={<FiFileText />}
          color="orange"
        />

        <StatCard
          title="Reports Uploaded"
          value={22}
          icon={<FiClock />}
          color="green"
        />
      </div>
    </div>
  );
}

export default LabTechnicianDashboard;