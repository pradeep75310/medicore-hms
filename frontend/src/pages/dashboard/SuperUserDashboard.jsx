import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiArrowRight,
  FiHome,
  FiActivity,
  FiUserCheck,
  FiUserPlus,
  FiRefreshCw,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiDownload,
  FiX,
  FiSettings,
} from "react-icons/fi";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import PageHeader from "../../components/common/PageHeader";
import { dashboardApi } from "../../api/service";

import {
  statsData,
  revenueData,
  patientFlowData,
  bedOccupancy,
  departments,
} from "../../utils/mockData";

// ============================================================
// CONSTANTS
// ============================================================

const COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const MOCK_NURSES = [
  { id: 1, name: "Anjali Sharma", department: "Emergency", status: "Active" },
  { id: 2, name: "Pooja Singh", department: "ICU", status: "Active" },
  { id: 3, name: "Neha Gupta", department: "General Ward", status: "Active" },
  { id: 4, name: "Kiran Yadav", department: "OPD", status: "Active" },
];

const MOCK_RECEPTIONISTS = [
  { id: 1, name: "Riya Sharma", branch: "Main Branch", status: "Active" },
  { id: 2, name: "Komal Singh", branch: "City Branch", status: "Active" },
  { id: 3, name: "Priya Gupta", branch: "North Branch", status: "Active" },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;

  return [];
};

const getItemName = (item) => {
  const patient = typeof item?.patient === "object" ? item.patient : null;

  return (
    item?.name ||
    item?.full_name ||
    item?.patient_name ||
    patient?.full_name ||
    patient?.name ||
    item?.hospital_name ||
    item?.branch_name ||
    item?.doctor_name ||
    item?.username ||
    item?.email ||
    (typeof item?.patient === "string" ? item.patient : null) ||
    "N/A"
  );
};

const getItemDate = (item) =>
  item?.created_at ||
  item?.createdAt ||
  item?.date_joined ||
  item?.registration_date ||
  item?.appointment_date ||
  item?.scheduled_date ||
  item?.date ||
  item?.created ||
  null;

const getAppointmentDate = (appointment) =>
  appointment?.appointment_date ||
  appointment?.scheduled_date ||
  appointment?.date ||
  appointment?.start_time ||
  appointment?.appointment_datetime ||
  appointment?.created_at ||
  null;

const getLocalDateKey = (value) => {
  if (!value) return null;

  // Date-only values should not be shifted by timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return String(value);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getItemStatus = (item) => {
  if (item?.status) {
    return String(item.status).trim();
  }

  if (typeof item?.is_active === "boolean") {
    return item.is_active ? "Active" : "Inactive";
  }

  if (typeof item?.is_approved === "boolean") {
    return item.is_approved ? "Approved" : "Pending";
  }

  return "N/A";
};

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAppointmentTime = (appointment) => {
  if (appointment?.time) return appointment.time;

  const dateValue = getAppointmentDate(appointment);

  if (!dateValue) return "N/A";

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  const normalized = String(status).toLowerCase();

  if (
    ["active", "confirmed", "approved", "completed", "paid"].includes(
      normalized,
    )
  ) {
    return "bg-green-100 text-green-700";
  }

  if (["pending", "scheduled", "processing"].includes(normalized)) {
    return "bg-amber-100 text-amber-700";
  }

  if (
    ["inactive", "cancelled", "canceled", "rejected", "failed"].includes(
      normalized,
    )
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-600";
};

// Convert nested API objects into Excel-friendly values.
const flattenExportData = (data) => {
  return data.map((item) => {
    const flattened = {};

    Object.entries(item || {}).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        flattened[key] = "";
      } else if (Array.isArray(value)) {
        flattened[key] = value
          .map((entry) =>
            typeof entry === "object" ? JSON.stringify(entry) : String(entry),
          )
          .join(", ");
      } else if (typeof value === "object") {
        flattened[key] = JSON.stringify(value);
      } else {
        flattened[key] = value;
      }
    });

    return flattened;
  });
};

// ============================================================
// MAIN SUPER USER DASHBOARD
// ============================================================

function SuperUserDashboard({ user }) {
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeCard, setActiveCard] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Prevent overlapping requests and state updates after unmount.
  const isMountedRef = useRef(false);
  const requestInProgressRef = useRef(false);

  // ==========================================================
  // LOAD DASHBOARD API
  // ==========================================================

  const loadDashboard = useCallback(async (initial = false) => {
    if (requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    if (isMountedRef.current) {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
    }

    try {
      const results = await Promise.allSettled([
        dashboardApi.branches(),
        dashboardApi.hospitals(),
        dashboardApi.patients(),
        dashboardApi.doctors(),
        dashboardApi.appointments(),
      ]);

      if (!isMountedRef.current) return;

      const setters = [
        setBranches,
        setHospitals,
        setPatients,
        setDoctors,
        setAppointmentsList,
      ];

      const labels = [
        "Branches",
        "Hospitals",
        "Patients",
        "Doctors",
        "Appointments",
      ];

      let successfulRequests = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](normalizeList(result.value));
          successfulRequests++;
        } else {
          console.error(`${labels[index]} API failed:`, result.reason);
        }
      });

      if (successfulRequests === 0) {
        toast.error("Dashboard data could not be loaded.");
      } else if (successfulRequests < results.length) {
        console.warn(
          "Some dashboard APIs failed. Available data has been retained.",
        );
      }
    } catch (error) {
      console.error("Dashboard loading failed:", error);

      if (isMountedRef.current) {
        toast.error("Something went wrong while loading dashboard.");
      }
    } finally {
      requestInProgressRef.current = false;

      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    isMountedRef.current = true;

    loadDashboard(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]);

  // ==========================================================
  // AUTOMATIC REFRESH
  // ==========================================================

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      loadDashboard(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboard]);

  // ==========================================================
  // PATIENT MONTHLY DATA
  // ==========================================================

  const realPatientMonthlyData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentYear = new Date().getFullYear();

    return months.map((month, monthIndex) => {
      const count = patients.filter((patient) => {
        const date = getItemDate(patient);

        if (!date) return false;

        const parsed = new Date(date);

        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.getFullYear() === currentYear &&
          parsed.getMonth() === monthIndex
        );
      }).length;

      return {
        month,
        patients: count,
      };
    });
  }, [patients]);

  // ==========================================================
  // ORGANIZATION DATA
  // ==========================================================

  const organizationData = useMemo(
    () => [
      {
        name: "Hospitals",
        value: hospitals.length,
      },
      {
        name: "Branches",
        value: branches.length,
      },
    ],
    [hospitals.length, branches.length],
  );

  // ==========================================================
  // REVENUE DATA (SAMPLE)
  // ==========================================================

  const dailyRevenue = statsData.dailyRevenue;

  // ==========================================================
  // TODAY'S APPOINTMENTS
  // ==========================================================

  const todaysAppointments = useMemo(() => {
    const today = getTodayDate();

    return appointmentsList
      .filter((appointment) => {
        const appointmentDate = getLocalDateKey(
          getAppointmentDate(appointment),
        );

        return appointmentDate === today;
      })
      .sort((a, b) => {
        const dateA = new Date(getAppointmentDate(a) || 0);
        const dateB = new Date(getAppointmentDate(b) || 0);

        return dateA - dateB;
      });
  }, [appointmentsList]);

  // ==========================================================
  // RECENT PATIENTS
  // ==========================================================

  const recentPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const dateA = getItemDate(a) ? new Date(getItemDate(a)).getTime() : 0;

      const dateB = getItemDate(b) ? new Date(getItemDate(b)).getTime() : 0;

      return dateB - dateA;
    });
  }, [patients]);

  // ==========================================================
  // DETAIL DATA
  // ==========================================================

  const detailData = useMemo(() => {
    if (!activeCard) return [];

    let data = [];

    switch (activeCard) {
      case "branches":
        data = branches;
        break;

      case "hospitals":
        data = hospitals;
        break;

      case "patients":
        data = patients;
        break;

      case "appointments":
        data = appointmentsList;
        break;

      case "doctors":
        data = doctors;
        break;

      case "nurses":
        data = MOCK_NURSES;
        break;

      case "receptionists":
        data = MOCK_RECEPTIONISTS;
        break;

      default:
        data = [];
    }

    return data.filter((item) => {
      const text = JSON.stringify(item || {}).toLowerCase();

      const matchesSearch =
        !search || text.includes(search.toLowerCase().trim());

      const status = getItemStatus(item).toLowerCase();

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const itemDate = getLocalDateKey(
        activeCard === "appointments"
          ? getAppointmentDate(item)
          : getItemDate(item),
      );

      // Exclude records without dates when date filters are applied.
      const dateFilterActive = Boolean(fromDate || toDate);

      const matchesFrom = !fromDate || (itemDate && itemDate >= fromDate);

      const matchesTo = !toDate || (itemDate && itemDate <= toDate);

      const matchesDate =
        !dateFilterActive || (itemDate && matchesFrom && matchesTo);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    activeCard,
    branches,
    hospitals,
    patients,
    appointmentsList,
    doctors,
    search,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  const exportExcel = () => {
    if (!detailData.length) {
      toast.error("Data not available for export.");
      return;
    }

    try {
      const exportData = flattenExportData(detailData);

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Data");

      const fileName = `${activeCard}-data.xlsx`;

      XLSX.writeFile(workbook, fileName);

      toast.success("Excel file downloaded.");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Excel export failed.");
    }
  };

  // ==========================================================
  // EXPORT PDF
  // ==========================================================

  const exportPDF = () => {
    if (!detailData.length) {
      toast.error("Data not available for export.");
      return;
    }

    try {
      const doc = new jsPDF();

      const title = activeCard.charAt(0).toUpperCase() + activeCard.slice(1);

      const rows = detailData.map((item, index) => [
        index + 1,
        getItemName(item),
        getItemStatus(item),
        formatDate(
          activeCard === "appointments"
            ? getAppointmentDate(item)
            : getItemDate(item),
        ),
      ]);

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");

      doc.text(`${title} Report`, 14, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 25);

      doc.text(`Total Records: ${detailData.length}`, 14, 31);

      autoTable(doc, {
        startY: 38,
        head: [["#", "Name", "Status", "Date"]],
        body: rows,
        theme: "grid",

        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: "linebreak",
        },

        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        margin: {
          left: 14,
          right: 14,
        },
      });

      doc.save(`${activeCard}-report.pdf`);

      toast.success("PDF file downloaded.");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("PDF export failed.");
    }
  };

  // ==========================================================
  // CLOSE DETAILS
  // ==========================================================

  const closeDetails = () => {
    setActiveCard(null);
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  // ==========================================================
  // DETAIL PAGE
  // ==========================================================

  if (activeCard) {
    const titles = {
      branches: "Branch Details",
      hospitals: "Hospital Details",
      patients: "Patient Details",
      appointments: "Appointment Details",
      doctors: "Doctor Details",
      nurses: "Nurse Details",
      receptionists: "Receptionist Details",
    };

    return (
      <div>
        <PageHeader
          title={titles[activeCard]}
          subtitle="Search, filter and export records"
          action={
            <button
              type="button"
              onClick={closeDetails}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
            >
              <FiArrowLeft />
              Back
            </button>
          }
        />

        {/* FILTER SECTION */}

        <div className="card mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 text-gray-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border px-10 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border px-3 py-3"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-xl border px-3 py-3"
            />

            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-xl border px-3 py-3"
            />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 hover:bg-gray-50"
            >
              <FiX />
              Clear
            </button>
          </div>

          {/* EXPORT BUTTONS */}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportExcel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              <FiDownload />
              Excel
            </button>

            <button
              type="button"
              onClick={exportPDF}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              <FiDownload />
              PDF
            </button>

            <span className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <FiFilter />
              {detailData.length} records
            </span>
          </div>
        </div>

        {/* DETAIL TABLE */}

        <div className="card overflow-hidden">
          {detailData.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-gray-400">
              <FiSearch size={40} />

              <p className="mt-3 font-medium">No data found</p>

              <p className="mt-1 text-sm">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {detailData.map((item, index) => {
                    const status = getItemStatus(item);

                    const date =
                      activeCard === "appointments"
                        ? getAppointmentDate(item)
                        : getItemDate(item);

                    return (
                      <tr
                        key={item?.id || `${activeCard}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{index + 1}</td>

                        <td className="px-4 py-3 font-medium">
                          {getItemName(item)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${getStatusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN DASHBOARD UI
  // ==========================================================

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${
          user?.name || user?.first_name || user?.username || "Admin"
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiSettings />
              Settings
            </button>

            <button
              type="button"
              onClick={() => loadDashboard(false)}
              disabled={refreshing || loading}
              className="btn-primary text-sm disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                Refresh
              </span>
            </button>
          </div>
        }
      />

      {/* ======================================================
          DASHBOARD SETTINGS
      ====================================================== */}

      {showSettings && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Dashboard Settings
              </h3>

              <p className="text-sm text-gray-500">
                Manage dashboard data refresh.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setShowSettings(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">
                Automatic data refresh
              </p>

              <p className="text-sm text-gray-500">
                Refresh data every 30 seconds.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoRefresh}
              onClick={() => setAutoRefresh((current) => !current)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                autoRefresh ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  autoRefresh ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Automatic refresh is {autoRefresh ? "enabled" : "disabled"}.
          </p>

          <button
            type="button"
            onClick={() => loadDashboard(false)}
            disabled={refreshing || loading}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh now
          </button>
        </div>
      )}

      {/* ======================================================
          DASHBOARD STATISTICS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Branches"
          value={loading ? "..." : branches.length}
          icon={<FiHome />}
          gradient="from-blue-600 to-cyan-500"
          onClick={() => setActiveCard("branches")}
        />

        <DashboardCard
          title="Total Hospitals"
          value={loading ? "..." : hospitals.length}
          icon={<FiActivity />}
          gradient="from-violet-600 to-purple-500"
          onClick={() => setActiveCard("hospitals")}
        />

        <DashboardCard
          title="Total Patients"
          value={loading ? "..." : patients.length}
          icon={<FiUsers />}
          gradient="from-emerald-600 to-green-500"
          onClick={() => setActiveCard("patients")}
        />

        <DashboardCard
          title="Total Appointments"
          value={loading ? "..." : appointmentsList.length}
          icon={<FiCalendar />}
          gradient="from-orange-600 to-amber-500"
          onClick={() => setActiveCard("appointments")}
        />

        <DashboardCard
          title="Total Doctors"
          value={loading ? "..." : doctors.length}
          icon={<FiUserCheck />}
          gradient="from-pink-600 to-rose-500"
          onClick={() => setActiveCard("doctors")}
        />

        <DashboardCard
          title="Daily Revenue"
          value={`₹${(dailyRevenue / 1000).toFixed(0)}K`}
          icon={<FiDollarSign />}
          gradient="from-indigo-600 to-blue-500"
          mock
        />

        <DashboardCard
          title="Total Nurses"
          value={MOCK_NURSES.length}
          icon={<FiUsers />}
          gradient="from-teal-600 to-cyan-500"
          mock
          onClick={() => setActiveCard("nurses")}
        />

        <DashboardCard
          title="Total Receptionists"
          value={MOCK_RECEPTIONISTS.length}
          icon={<FiUserPlus />}
          gradient="from-fuchsia-600 to-pink-500"
          mock
          onClick={() => setActiveCard("receptionists")}
        />
      </div>

      {/* ======================================================
          REVENUE OVERVIEW & BED OCCUPANCY
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Revenue Overview
              </h3>

              <p className="text-sm text-gray-500">
                Monthly revenue vs expenses
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient
                  id="dashboardRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />

                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

              <XAxis dataKey="month" />

              <YAxis
                tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
              />

              <Tooltip
                formatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                fill="url(#dashboardRevenue)"
                strokeWidth={2}
                name="Revenue"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-1 text-lg font-semibold text-gray-800">
            Bed Occupancy
          </h3>

          <p className="mb-1 text-sm text-gray-500">Current ward status</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={bedOccupancy}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="occupied"
                nameKey="ward"
              >
                {bedOccupancy.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {bedOccupancy.slice(0, 4).map((ward, index) => (
              <div key={ward.ward} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />

                <span className="text-xs text-gray-600">{ward.ward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          PATIENT FLOW & TODAY'S APPOINTMENTS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Patient Flow
            </h3>

            <p className="text-sm text-gray-500">Weekly patient visits</p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={patientFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="opd"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
                name="OPD"
              />

              <Bar
                dataKey="ipd"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="IPD"
              />

              <Bar
                dataKey="emergency"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Emergency"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Today's Appointments
              </h3>

              <p className="text-sm text-gray-500">
                Appointments scheduled for today
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveCard("appointments")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600"
            >
              View All
              <FiArrowRight size={14} />
            </button>
          </div>

          <div className="max-h-[280px] space-y-3 overflow-y-auto">
            {todaysAppointments.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center text-gray-400">
                <FiCalendar size={35} />

                <p className="mt-3 text-sm font-medium">
                  No appointments for today
                </p>

                <p className="mt-1 text-xs">
                  Today's scheduled appointments will appear here.
                </p>
              </div>
            ) : (
              todaysAppointments.slice(0, 5).map((appointment, index) => {
                const patientName =
                  typeof appointment.patient === "string"
                    ? appointment.patient
                    : appointment.patient?.full_name ||
                      appointment.patient?.name ||
                      appointment.patient_name ||
                      "N/A";

                const doctorName =
                  typeof appointment.doctor === "object"
                    ? appointment.doctor?.full_name ||
                      appointment.doctor?.name ||
                      "N/A"
                    : appointment.doctor_name || appointment.doctor || "N/A";

                const departmentName =
                  typeof appointment.department === "object"
                    ? appointment.department?.name || "N/A"
                    : appointment.department_name ||
                      appointment.department ||
                      "N/A";

                const status = getItemStatus(appointment);

                return (
                  <div
                    key={appointment.id || `appointment-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-blue-700">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {patientName}
                        </p>

                        <div className="truncate text-xs text-gray-500">
                          {doctorName} {" • "} {departmentName}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">
                        {getAppointmentTime(appointment)}
                      </p>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusClass(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          PATIENT TRENDS & ORGANIZATION OVERVIEW
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Patient Trends
            </h3>

            <p className="text-sm text-gray-500">
              Registrations during the current year
            </p>
          </div>

          {realPatientMonthlyData.some((item) => item.patients > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={realPatientMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Patients"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              Patient registration data is not available.
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Hospital & Branch Overview
            </h3>

            <p className="text-sm text-gray-500">
              Registered hospitals and branches
            </p>
          </div>

          {organizationData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={organizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {organizationData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-gray-400">
              No hospital or branch data found.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          RECENT PATIENTS
      ====================================================== */}

      <div className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Patients
            </h3>

            <p className="text-sm text-gray-500">
              Latest patient registrations
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveCard("patients")}
            className="flex items-center gap-1 text-sm font-medium text-blue-600"
          >
            View All
            <FiArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentPatients.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              No patient data found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {recentPatients.slice(0, 6).map((patient, index) => {
                  const status = getItemStatus(patient);

                  return (
                    <tr
                      key={patient.id || `patient-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {patient.id || index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-xs font-medium">
                              {getItemName(patient).charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <span className="text-sm font-medium text-gray-800">
                            {getItemName(patient)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(getItemDate(patient))}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================
          DEPARTMENT REVENUE
      ====================================================== */}

      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Department Revenue
          </h3>

          <p className="text-sm text-gray-500">
            Department-wise sample figures
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {departments.slice(0, 6).map((department, index) => (
            <div key={department.name}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{department.icon}</span>

                  <span className="text-sm font-medium text-gray-700">
                    {department.name}
                  </span>
                </div>

                <span className="text-sm text-gray-500">
                  ₹{(department.revenue / 1000).toFixed(0)}K
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (department.revenue / 520000) * 100,
                    )}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD STAT CARD
// ============================================================

function DashboardCard({
  title,
  value,
  icon,
  gradient,
  onClick,
  mock = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-default`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div className="rounded-xl bg-white/20 p-3">{icon}</div>

          <div className="flex items-center gap-2">
            {mock && (
              <span className="rounded-full bg-white/20 px-2 py-1 text-[10px]">
                SAMPLE
              </span>
            )}

            {onClick && (
              <FiArrowRight className="transition group-hover:translate-x-1" />
            )}
          </div>
        </div>

        <p className="text-sm text-white/80">{title}</p>

        <h2 className="mt-1 text-3xl font-bold">{value}</h2>
      </div>
    </button>
  );
}

export default SuperUserDashboard;
