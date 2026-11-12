import React, { useMemo, useState } from "react";

import {
  FiCalendar,
  FiFileText,
  FiHeart,
  FiClock,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiSearch,
  FiFilter,
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiActivity,
  FiChevronRight,
  FiArrowRight,
  FiPlus,
} from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";

const mockAppointments = [
  {
    id: 1,
    doctor: "Dr. Rajesh Sharma",
    department: "Cardiology",
    hospital: "Apollo Multispeciality Hospital",
    branch: "Main Campus",
    date: "2026-10-12",
    time: "10:30 AM",
    status: "Confirmed",
    type: "Consultation",
    reason: "Regular heart check-up",
  },
  {
    id: 2,
    doctor: "Dr. Priya Mehta",
    department: "General Medicine",
    hospital: "Apollo Multispeciality Hospital",
    branch: "Main Campus",
    date: "2026-10-18",
    time: "04:00 PM",
    status: "Pending",
    type: "Follow-up",
    reason: "Follow-up consultation",
  },
  {
    id: 3,
    doctor: "Dr. Amit Verma",
    department: "Orthopedics",
    hospital: "Apollo Multispeciality Hospital",
    branch: "Hinjewadi Clinic",
    date: "2026-09-25",
    time: "11:00 AM",
    status: "Completed",
    type: "Consultation",
    reason: "Knee pain consultation",
  },
  {
    id: 4,
    doctor: "Dr. Neha Kapoor",
    department: "Dermatology",
    hospital: "Apollo Multispeciality Hospital",
    branch: "Main Campus",
    date: "2026-08-20",
    time: "02:30 PM",
    status: "Completed",
    type: "Consultation",
    reason: "Skin consultation",
  },
  {
    id: 5,
    doctor: "Dr. Vikash Singh",
    department: "Neurology",
    hospital: "Apollo Multispeciality Hospital",
    branch: "Main Campus",
    date: "2026-10-25",
    time: "12:00 PM",
    status: "Confirmed",
    type: "Consultation",
    reason: "Neurology consultation",
  },
];

const mockPrescriptions = [
  {
    id: 101,
    doctor: "Dr. Rajesh Sharma",
    department: "Cardiology",
    appointmentDate: "2026-10-05",
    medicineCount: 4,
    status: "Pending",
  },
  {
    id: 102,
    doctor: "Dr. Priya Mehta",
    department: "General Medicine",
    appointmentDate: "2026-09-18",
    medicineCount: 3,
    status: "Pending",
  },
];
const mockHospital = {
  name: "Apollo Multispeciality Hospital",
  type: "Private Hospital",
  phone: "+91 98765 43210",
  email: "info@apollomedicare.com",
  address: "Main Road, Pune, Maharashtra",
};

const mockBranch = {
  name: "Main Campus",
  code: "APL-MAIN-001",
  phone: "+91 98765 43211",
  address: "Wakad Main Road, Pune, Maharashtra",
};

const mockMedicalReports = [
  {
    id: 1,
    name: "Blood Test Report",
    type: "Laboratory",
    date: "2026-10-02",
    doctor: "Dr. Rajesh Sharma",
  },
  {
    id: 2,
    name: "ECG Report",
    type: "Cardiology",
    date: "2026-09-28",
    doctor: "Dr. Rajesh Sharma",
  },
  {
    id: 3,
    name: "X-Ray Report",
    type: "Radiology",
    date: "2026-09-20",
    doctor: "Dr. Amit Verma",
  },
];

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (String(status).toLowerCase()) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "completed":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function PatientDashboard({ user }) {
  const [activeView, setActiveView] = useState("dashboard");

  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [downloadedPrescriptions, setDownloadedPrescriptions] = useState([]);

  const [showAllReports, setShowAllReports] = useState(false);

  /* =========================================================
     APPOINTMENT FILTER
     ========================================================= */

  const filteredAppointments = useMemo(() => {
    return mockAppointments.filter((appointment) => {
      const matchesSearch =
        appointment.doctor.toLowerCase().includes(search.toLowerCase()) ||
        appointment.department.toLowerCase().includes(search.toLowerCase()) ||
        appointment.hospital.toLowerCase().includes(search.toLowerCase());

      const matchesDoctor =
        !doctorFilter || appointment.doctor === doctorFilter;

      const matchesFromDate = !fromDate || appointment.date >= fromDate;

      const matchesToDate = !toDate || appointment.date <= toDate;

      return matchesSearch && matchesDoctor && matchesFromDate && matchesToDate;
    });
  }, [search, doctorFilter, fromDate, toDate]);

  /* =========================================================
     UPCOMING APPOINTMENTS
     ========================================================= */

  const upcomingAppointments = useMemo(() => {
    return mockAppointments.filter(
      (item) => item.status === "Confirmed" || item.status === "Pending",
    );
  }, []);

  /* =========================================================
     PENDING PRESCRIPTIONS
     ========================================================= */

  const pendingPrescriptions = mockPrescriptions.filter(
    (item) => item.status === "Pending",
  );

  /* =========================================================
     DOCTOR FILTER OPTIONS
     ========================================================= */

  const doctors = [
    ...new Set(mockAppointments.map((appointment) => appointment.doctor)),
  ];

  /* =========================================================
     PRESCRIPTION DOWNLOAD
     ========================================================= */

  const downloadPrescription = (prescription) => {
    const prescriptionText = `
MEDICORE HMS
PATIENT PRESCRIPTION

Doctor: ${prescription.doctor}
Department: ${prescription.department}
Appointment Date: ${formatDate(prescription.appointmentDate)}

Prescription ID: ${prescription.id}

This is a demo prescription generated from mock data.
    `;

    const blob = new Blob([prescriptionText], { type: "text/plain" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `prescription-${prescription.id}.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setDownloadedPrescriptions((previous) => [...previous, prescription.id]);
  };

  /* =========================================================
     QUICK ACTION
     ========================================================= */

  const openAppointments = () => {
    setActiveView("appointments");
  };

  /* =========================================================
     DASHBOARD VIEW
     ========================================================= */

  if (activeView === "dashboard") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Dashboard"
          subtitle={`Welcome back, ${
            user?.name || user?.first_name || "Patient"
          }. Here's your complete care summary.`}
        />

        {/* =====================================================
            WELCOME BANNER
        ===================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-sm font-medium text-blue-100">
              MediCore Patient Portal
            </p>

            <h2 className="text-2xl font-bold md:text-3xl">
              Take control of your healthcare
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-50">
              Manage appointments, prescriptions, medical reports and your
              healthcare information from one place.
            </p>

            <button
              onClick={() => setActiveView("appointments")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
            >
              View Appointments
              <FiArrowRight />
            </button>
          </div>

          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/10" />
        </div>

        {/* =====================================================
            STAT CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div onClick={openAppointments} className="cursor-pointer">
            <StatCard
              title="Total Appointments"
              value={mockAppointments.length}
              icon={<FiCalendar />}
              color="blue"
            />
          </div>

          <div onClick={openAppointments} className="cursor-pointer">
            <StatCard
              title="Upcoming Appointments"
              value={upcomingAppointments.length}
              icon={<FiClock />}
              color="green"
            />
          </div>

          <div
            onClick={() => setActiveView("prescriptions")}
            className="cursor-pointer"
          >
            <StatCard
              title="Pending Prescriptions"
              value={pendingPrescriptions.length}
              icon={<FiHeart />}
              color="purple"
            />
          </div>

          <div
            onClick={() => setActiveView("reports")}
            className="cursor-pointer"
          >
            <StatCard
              title="Medical Reports"
              value={mockMedicalReports.length}
              icon={<FiFileText />}
              color="orange"
            />
          </div>
        </div>

        {/* =====================================================
            NEXT APPOINTMENT + PROFILE
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* NEXT APPOINTMENT */}

          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Next Appointment
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your upcoming healthcare visit
                </p>
              </div>

              <FiCalendar className="text-xl text-blue-500" />
            </div>

            {upcomingAppointments[0] ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <FiUser className="text-xl" />
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {upcomingAppointments[0].doctor}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        {upcomingAppointments[0].department}
                      </p>

                      <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                        <FiMapPin />
                        {upcomingAppointments[0].branch}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {formatDate(upcomingAppointments[0].date)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {upcomingAppointments[0].time}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                        upcomingAppointments[0].status,
                      )}`}
                    >
                      {upcomingAppointments[0].status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedAppointment(upcomingAppointments[0])
                  }
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Appointment
                  <FiChevronRight />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <FiCalendar className="mx-auto text-3xl text-gray-300" />

                <p className="mt-3 text-sm text-gray-500">
                  No upcoming appointments.
                </p>
              </div>
            )}
          </div>

          {/* PATIENT PROFILE */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">My Profile</h3>

                <p className="mt-1 text-sm text-gray-500">
                  Personal information
                </p>
              </div>

              <FiUser className="text-xl text-purple-500" />
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Patient Name
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {user?.name || user?.first_name || "Patient"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <FiMail />
                  {user?.email || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Phone
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <FiPhone />
                  {user?.phone || "+91 98765 43210"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView("profile")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View Profile
              <FiChevronRight />
            </button>
          </div>
        </div>

        {/* =====================================================
            HOSPITAL + BRANCH
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InfoCard
            icon={<FiHeart />}
            title="Registered Hospital"
            subtitle="Your registered healthcare facility"
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">
                {mockHospital.name}
              </h4>

              <p className="text-sm text-gray-500">{mockHospital.type}</p>

              <p className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin />
                {mockHospital.address}
              </p>

              <p className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone />
                {mockHospital.phone}
              </p>

              <p className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail />
                {mockHospital.email}
              </p>
            </div>
          </InfoCard>

          <InfoCard
            icon={<FiMapPin />}
            title="Registered Branch"
            subtitle="Your current hospital branch"
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">{mockBranch.name}</h4>

              <p className="text-sm text-gray-500">
                Branch Code: {mockBranch.code}
              </p>

              <p className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin />
                {mockBranch.address}
              </p>

              <p className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone />
                {mockBranch.phone}
              </p>
            </div>
          </InfoCard>
        </div>

        {/* =====================================================
            RECENT APPOINTMENTS
        ===================================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h3 className="font-bold text-gray-800">Recent Appointments</h3>

              <p className="mt-1 text-sm text-gray-500">
                Your latest appointment activity
              </p>
            </div>

            <button
              onClick={openAppointments}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {mockAppointments.slice(0, 4).map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col justify-between gap-3 p-5 transition hover:bg-gray-50 md:flex-row md:items-center"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FiCalendar />
                  </div>

                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.doctor}
                    </p>

                    <p className="text-sm text-gray-500">
                      {appointment.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-sm text-gray-500">
                    {formatDate(appointment.date)}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                      appointment.status,
                    )}`}
                  >
                    {appointment.status}
                  </span>

                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <FiEye />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={<FiCalendar />}
              title="Appointments"
              subtitle="View all appointments"
              onClick={() => setActiveView("appointments")}
            />

            <QuickAction
              icon={<FiFileText />}
              title="Medical Reports"
              subtitle="View your reports"
              onClick={() => setActiveView("reports")}
            />

            <QuickAction
              icon={<FiHeart />}
              title="Prescriptions"
              subtitle="View prescriptions"
              onClick={() => setActiveView("prescriptions")}
            />

            <QuickAction
              icon={<FiUser />}
              title="My Profile"
              subtitle="Manage profile"
              onClick={() => setActiveView("profile")}
            />
          </div>
        </div>

        {/* =====================================================
            APPOINTMENT DETAIL MODAL
        ===================================================== */}

        {selectedAppointment && (
          <AppointmentModal
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onPrescription={() => setActiveView("prescriptions")}
          />
        )}
      </div>
    );
  }

  /* =========================================================
     APPOINTMENTS VIEW
     ========================================================= */

  if (activeView === "appointments") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Appointments"
          subtitle="View and manage all your appointments."
          action={
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <FiPlus />
              Book Appointment
            </button>
          }
        />

        {/* FILTERS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiFilter className="text-blue-600" />

            <h3 className="font-semibold text-gray-800">Filter Appointments</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />

              <input
                type="text"
                placeholder="Search doctor, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Doctors</option>

              {doctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* APPOINTMENT LIST */}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h3 className="font-bold text-gray-800">Appointment History</h3>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredAppointments.length} appointments
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FiCalendar className="text-xl" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {appointment.doctor}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {appointment.department}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>{formatDate(appointment.date)}</span>

                          <span>{appointment.time}</span>

                          <span>{appointment.branch}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                          appointment.status,
                        )}`}
                      >
                        {appointment.status}
                      </span>

                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <FiEye />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <FiSearch className="mx-auto text-3xl text-gray-300" />

                <p className="mt-3 text-sm text-gray-500">
                  No appointments found.
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveView("dashboard")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>

        {selectedAppointment && (
          <AppointmentModal
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onPrescription={() => setActiveView("prescriptions")}
          />
        )}
      </div>
    );
  }

  /* =========================================================
     PRESCRIPTIONS VIEW
     ========================================================= */

  if (activeView === "prescriptions") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Prescriptions"
          subtitle="View and download your prescriptions."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {mockPrescriptions.map((prescription) => {
            const isDownloaded = downloadedPrescriptions.includes(
              prescription.id,
            );

            return (
              <div
                key={prescription.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <FiHeart />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {prescription.doctor}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {prescription.department}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {prescription.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Appointment Date</p>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {formatDate(prescription.appointmentDate)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Medicines</p>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {prescription.medicineCount}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadPrescription(prescription)}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    isDownloaded
                      ? "bg-emerald-600 text-white"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {isDownloaded ? (
                    <>
                      <FiCheckCircle />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <FiDownload />
                      Download Prescription
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setActiveView("dashboard")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  /* =========================================================
     MEDICAL REPORTS VIEW
     ========================================================= */

  if (activeView === "reports") {
    const reportsToShow = showAllReports
      ? mockMedicalReports
      : mockMedicalReports.slice(0, 3);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Medical Reports"
          subtitle="View your laboratory and medical reports."
        />

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h3 className="font-bold text-gray-800">My Reports</h3>

              <p className="mt-1 text-sm text-gray-500">
                Your latest medical documents
              </p>
            </div>

            <FiFileText className="text-xl text-blue-500" />
          </div>

          <div className="divide-y divide-gray-100">
            {reportsToShow.map((report) => (
              <div
                key={report.id}
                className="flex flex-col justify-between gap-4 p-5 transition hover:bg-gray-50 md:flex-row md:items-center"
              >
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FiFileText />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {report.name}
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      {report.type} • {report.doctor}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(report.date)}
                    </p>
                  </div>
                </div>

                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <FiEye />
                  View Report
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAllReports(!showAllReports)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {showAllReports ? "Show Less" : "View All Reports"}
        </button>

        <br />

        <button
          onClick={() => setActiveView("dashboard")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  /* =========================================================
     PROFILE VIEW
     ========================================================= */

  if (activeView === "profile") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          subtitle="Manage your personal information."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {(user?.name || user?.first_name || "P").charAt(0).toUpperCase()}
            </div>

            <h3 className="mt-4 text-lg font-bold text-gray-800">
              {user?.name || user?.first_name || "Patient"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">Patient</p>

            <button className="mt-5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Upload Medical Report
            </button>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800">
              Personal Information
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <ProfileField
                label="First Name"
                value={user?.first_name || "Pradeep"}
              />

              <ProfileField
                label="Last Name"
                value={user?.last_name || "Patient"}
              />

              <ProfileField
                label="Email"
                value={user?.email || "patient@example.com"}
              />

              <ProfileField
                label="Phone"
                value={user?.phone || "+91 98765 43210"}
              />

              <ProfileField label="Hospital" value={mockHospital.name} />

              <ProfileField label="Branch" value={mockBranch.name} />
            </div>

            <button className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>

        <button
          onClick={() => setActiveView("dashboard")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return null;
}

/* =========================================================
   INFO CARD
   ========================================================= */

function InfoCard({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>

          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   QUICK ACTION
   ========================================================= */

function QuickAction({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        <FiChevronRight className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>

      <h4 className="mt-4 font-semibold text-gray-800">{title}</h4>

      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </button>
  );
}

/* =========================================================
   PROFILE FIELD
   ========================================================= */

function ProfileField({ label, value }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </label>

      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   APPOINTMENT MODAL
   ========================================================= */

function AppointmentModal({ appointment, onClose, onPrescription }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Appointment Details
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Appointment #{appointment.id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <FiX />
          </button>
        </div>

        {/* BODY */}

        <div className="space-y-5 p-5">
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FiUser className="text-xl" />
              </div>

              <div>
                <h4 className="font-bold text-gray-800">
                  {appointment.doctor}
                </h4>

                <p className="text-sm text-gray-500">
                  {appointment.department}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Date" value={formatDate(appointment.date)} />

            <DetailItem label="Time" value={appointment.time} />

            <DetailItem label="Hospital" value={appointment.hospital} />

            <DetailItem label="Branch" value={appointment.branch} />

            <DetailItem label="Appointment Type" value={appointment.type} />

            <DetailItem label="Status" value={appointment.status} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Reason
            </p>

            <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {appointment.reason}
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
          {appointment.status === "Completed" && (
            <button
              onClick={onPrescription}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <FiFileText />
              Prescription
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
   ========================================================= */

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

export default PatientDashboard;
