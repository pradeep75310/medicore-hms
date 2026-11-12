import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import {
  FiDollarSign,
  FiFileText,
  FiClock,
  FiLayers,
} from "react-icons/fi";

import { statsData } from "../../utils/mockData";


// =========================================================
// ACCOUNTANT DASHBOARD
// =========================================================

function AccountantDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        subtitle={`Welcome, ${
          user?.name || "Accountant"
        }. Billing and revenue tracking.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Daily Revenue"
          value={`₹${(statsData.dailyRevenue / 1000).toFixed(0)}K`}
          icon={<FiDollarSign />}
          color="purple"
        />

        <StatCard
          title="Pending Bills"
          value={14}
          icon={<FiFileText />}
          color="orange"
        />

        <StatCard
          title="Bills Cleared Today"
          value={38}
          icon={<FiClock />}
          color="green"
        />

        <StatCard
          title="Insurance Claims"
          value={9}
          icon={<FiLayers />}
          color="blue"
        />
      </div>
    </div>
  );
}

export default AccountantDashboard;