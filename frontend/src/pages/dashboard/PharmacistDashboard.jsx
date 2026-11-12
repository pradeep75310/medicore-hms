import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import { FiShoppingCart, FiLayers, FiDollarSign } from "react-icons/fi";

import { statsData } from "../../utils/mockData";

// =========================================================
// PHARMACIST DASHBOARD
// =========================================================

function PharmacistDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Pharmacy Dashboard"
        subtitle={`Welcome, ${
          user?.name || "Pharmacist"
        }. Inventory control and medicine billing.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Orders Today"
          value={statsData.pharmacyOrders}
          icon={<FiShoppingCart />}
          color="blue"
        />

        <StatCard
          title="Low Stock Items"
          value={7}
          icon={<FiLayers />}
          color="red"
        />

        <StatCard
          title="Bills Generated"
          value={31}
          icon={<FiDollarSign />}
          color="green"
        />
      </div>
    </div>
  );
}

export default PharmacistDashboard;
