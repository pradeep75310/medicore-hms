import React from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiActivity,
} from "react-icons/fi";

import {
  statsData,
  appointments,
} from "../../utils/mockData";

export default function DoctorDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Doctor Dashboard"
        subtitle={`Welcome back, ${
          user?.name ||
          user?.first_name ||
          "Doctor"
        }. Here's your practice overview for today.`}
      />

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Today's Appointments"
          value={appointments.length}
          icon={<FiCalendar />}
          color="blue"
        />

        <StatCard
          title="Total Patients"
          value={statsData.totalPatients}
          icon={<FiUsers />}
          color="green"
        />

        <StatCard
          title="Pending Appointments"
          value={
            appointments.filter(
              (item) =>
                String(
                  item?.status || "",
                ).toLowerCase() ===
                "pending",
            ).length
          }
          icon={<FiClock />}
          color="orange"
        />

        <StatCard
          title="Completed Today"
          value={
            appointments.filter(
              (item) =>
                String(
                  item?.status || "",
                ).toLowerCase() ===
                "completed",
            ).length
          }
          icon={<FiActivity />}
          color="purple"
        />
      </div>

      {/* =================================================
          TODAY'S APPOINTMENTS
      ================================================= */}

      <div className="card">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800">
            Today's Appointments
          </h3>

          <p className="text-sm text-gray-500">
            Your scheduled appointments for today
          </p>
        </div>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              No appointments scheduled for today.
            </div>
          ) : (
            appointments.slice(0, 8).map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                    <span className="font-semibold text-blue-700">
                      {appointment.patient?.charAt(0) ||
                        "P"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {appointment.patient ||
                        "Patient"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {appointment.department ||
                        "General"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-xs text-gray-400">
                      Time
                    </p>

                    <p className="text-sm font-medium text-gray-700">
                      {appointment.time ||
                        "N/A"}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {appointment.status ||
                      "Scheduled"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}