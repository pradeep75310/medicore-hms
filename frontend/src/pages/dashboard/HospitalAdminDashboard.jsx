import React, { useEffect, useMemo, useState } from "react";

import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiLayers,
  FiHeart,
  FiDroplet,
  FiShoppingCart,
  FiUserCheck,
  FiUserPlus,
  FiRefreshCw,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiDownload,
  FiHome,
  FiActivity,
} from "react-icons/fi";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import StatCard from "../../components/common/StatCard";

import { dashboardApi } from "../../api/service";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
};

const getRecordDate = (item) =>
  item?.created_at ||
  item?.createdAt ||
  item?.date_joined ||
  item?.registration_date ||
  item?.appointment_date ||
  item?.scheduled_date ||
  item?.billing_date ||
  item?.invoice_date ||
  item?.date ||
  item?.created ||
  null;

const getRecordHospitalId = (item) =>
  item?.hospital_id ||
  item?.hospital?.id ||
  (typeof item?.hospital === "number" ? item.hospital : null) ||
  item?.branch?.hospital_id ||
  item?.branch?.hospital?.id ||
  item?.department?.branch?.hospital_id ||
  item?.department?.branch?.hospital?.id ||
  null;

const getRecordRole = (item) =>
  String(
    item?.role || item?.user?.role || item?.staff_role || item?.user_role || "",
  )
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const getNumericAmount = (item, keys) => {
  for (const key of keys) {
    const raw = item?.[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const amount = Number(String(raw).replace(/[₹,\s]/g, ""));
      if (Number.isFinite(amount)) return amount;
    }
  }
  return 0;
};

const getPaidAmount = (item) => {
  const paidKeys = ["paid_amount", "total_paid", "amount_paid", "paid"];
  const hasPaidAmount = paidKeys.some(
    (key) =>
      item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== "",
  );
  if (hasPaidAmount) return getNumericAmount(item, paidKeys);
  const status = String(
    item?.payment_status || item?.status || "",
  ).toLowerCase();
  if (!["paid", "completed", "success", "successful"].includes(status))
    return 0;
  return getNumericAmount(item, [
    "grand_total",
    "total_amount",
    "amount",
    "total",
  ]);
};

const getAppointmentDate = (item) =>
  item?.appointment_date ||
  item?.appointmentDate ||
  item?.scheduled_date ||
  item?.date ||
  item?.created_at ||
  item?.createdAt ||
  null;

const getAppointmentTime = (item) =>
  item?.appointment_time ||
  item?.scheduled_time ||
  item?.time ||
  item?.start_time ||
  "";

// =========================================================
// HOSPITAL ADMIN DASHBOARD
// =========================================================

function HospitalAdminDashboard({ user }) {
  const [hospital, setHospital] = useState(null);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [labTechnicians, setLabTechnicians] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeCard, setActiveCard] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // =======================================================
  // HOSPITAL ID
  // =======================================================

  const hospitalId =
    user?.hospital_id ||
    user?.hospital?.id ||
    (typeof user?.hospital === "number" ? user.hospital : null);

  // =======================================================
  // LOAD DASHBOARD
  // =======================================================

  const loadDashboard = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);

    if (!hospitalId) {
      setHospital(null);
      setBranches([]);
      setDepartments([]);
      setPatients([]);
      setDoctors([]);
      setNurses([]);
      setLabTechnicians([]);
      setPharmacists([]);
      setReceptionists([]);
      setAppointmentData([]);
      setBillingRecords([]);
      toast.error("Hospital information user account me available nahi hai.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const params = { hospital: hospitalId };
    const apiResults = await Promise.allSettled([
      dashboardApi.hospitals(),
      dashboardApi.branches(params),
      dashboardApi.departments(params),
      dashboardApi.patients(params),
      dashboardApi.doctors(params),
      dashboardApi.nurses(params),
      dashboardApi.appointments(params),
      dashboardApi.billing(params),
      dashboardApi.staff(params),
    ]);

    const responseAt = (index) =>
      apiResults[index].status === "fulfilled" ? apiResults[index].value : [];

    const filterHospitalRecords = (response) =>
      normalizeList(response).filter((item) => {
        const recordHospitalId = getRecordHospitalId(item);
        // API ko hospital scope enforce karna chahiye. Client-side check
        // sirf un records ko remove karta hai jinka hospital ID available hai.
        return (
          !recordHospitalId || String(recordHospitalId) === String(hospitalId)
        );
      });

    try {
      const hospitalList = normalizeList(responseAt(0));
      const ownHospital =
        hospitalList.find((item) => String(item?.id) === String(hospitalId)) ||
        (hospitalList.length === 1 ? hospitalList[0] : null);
      setHospital(ownHospital);

      setBranches(filterHospitalRecords(responseAt(1)));
      setDepartments(filterHospitalRecords(responseAt(2)));
      setPatients(filterHospitalRecords(responseAt(3)));
      setDoctors(filterHospitalRecords(responseAt(4)));
      setNurses(filterHospitalRecords(responseAt(5)));
      setAppointmentData(filterHospitalRecords(responseAt(6)));
      setBillingRecords(filterHospitalRecords(responseAt(7)));

      const staffList = filterHospitalRecords(responseAt(8));
      setLabTechnicians(
        staffList.filter((item) => getRecordRole(item) === "LAB_TECHNICIAN"),
      );
      setPharmacists(
        staffList.filter((item) => getRecordRole(item) === "PHARMACIST"),
      );
      setReceptionists(
        staffList.filter((item) => getRecordRole(item) === "RECEPTIONIST"),
      );

      const labels = [
        "Hospital",
        "Branches",
        "Departments",
        "Patients",
        "Doctors",
        "Nurses",
        "Appointments",
        "Billing",
        "Staff",
      ];
      const failed = apiResults
        .map((result, index) =>
          result.status === "rejected" ? labels[index] : null,
        )
        .filter(Boolean);
      if (failed.length === apiResults.length) {
        toast.error("Dashboard APIs data not loaded.");
      } else if (failed.length) {
        console.warn("Dashboard APIs failed:", failed);
        toast.error(`${failed.join(", ")} data not load.`);
      }
    } catch (error) {
      console.error("Hospital Admin Dashboard error:", error);
      toast.error(error?.message || "Dashboard data not load.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard(true);
    const intervalId = setInterval(() => loadDashboard(false), 30000);
    return () => clearInterval(intervalId);
  }, [hospitalId]);

  // =======================================================
  // HOSPITAL NAME
  // =======================================================

  const hospitalName =
    hospital?.name ||
    hospital?.legal_name ||
    user?.hospital_name ||
    user?.hospital?.name ||
    "My Hospital";

  // =======================================================
  // LIVE DASHBOARD METRICS
  // =======================================================

  const todayKey = new Date().toLocaleDateString("en-CA");

  const todayAppointments = useMemo(
    () =>
      appointmentData
        .filter((item) => {
          const date = getAppointmentDate(item);
          return (
            date && new Date(date).toLocaleDateString("en-CA") === todayKey
          );
        })
        .sort((a, b) =>
          String(getAppointmentTime(a)).localeCompare(
            String(getAppointmentTime(b)),
          ),
        ),
    [appointmentData, todayKey],
  );

  const totalAppointments = appointmentData.length;

  const dailyRevenue = useMemo(
    () =>
      billingRecords
        .filter((record) => {
          const date = getRecordDate(record);
          return (
            date && new Date(date).toLocaleDateString("en-CA") === todayKey
          );
        })
        .reduce((sum, record) => sum + getPaidAmount(record), 0),
    [billingRecords, todayKey],
  );

  const revenueData = useMemo(() => {
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
    const year = new Date().getFullYear();
    return months.map((month, monthIndex) => {
      const monthRecords = billingRecords.filter((record) => {
        const rawDate = getRecordDate(record);
        if (!rawDate) return false;
        const date = new Date(rawDate);
        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === year &&
          date.getMonth() === monthIndex
        );
      });
      return {
        month,
        revenue: monthRecords.reduce(
          (sum, record) => sum + getPaidAmount(record),
          0,
        ),
        expenses: monthRecords.reduce(
          (sum, record) =>
            sum +
            getNumericAmount(record, [
              "expense_amount",
              "expenses",
              "cost_amount",
            ]),
          0,
        ),
      };
    });
  }, [billingRecords]);

  const patientMonthlyData = useMemo(() => {
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
    const year = new Date().getFullYear();
    return months.map((month, monthIndex) => ({
      month,
      patients: patients.filter((patient) => {
        const rawDate = getRecordDate(patient);
        if (!rawDate) return false;
        const date = new Date(rawDate);
        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === year &&
          date.getMonth() === monthIndex
        );
      }).length,
    }));
  }, [patients]);

  const patientFlowData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        dateKey: date.toLocaleDateString("en-CA"),
        appointments: 0,
      };
    });
    appointmentData.forEach((item) => {
      const rawDate = getAppointmentDate(item);
      if (!rawDate) return;
      const dateKey = new Date(rawDate).toLocaleDateString("en-CA");
      const day = days.find((entry) => entry.dateKey === dateKey);
      if (day) day.appointments += 1;
    });
    return days;
  }, [appointmentData]);

  const staffChartData = [
    { name: "Doctors", value: doctors.length },
    { name: "Nurses", value: nurses.length },
    { name: "Lab", value: labTechnicians.length },
    { name: "Pharmacy", value: pharmacists.length },
    { name: "Reception", value: receptionists.length },
  ];

  const resourceChartData = [
    { name: "Branches", value: branches.length },
    { name: "Departments", value: departments.length },
    { name: "Patients", value: patients.length },
    { name: "Appointments", value: totalAppointments },
  ];

  const appointmentTrendData = patientFlowData.map((item) => ({
    date: item.day,
    appointments: item.appointments,
  }));

  // =======================================================
  // DASHBOARD CARDS
  // =======================================================

  const dashboardCards = [
    {
      key: "branches",
      title: "Branches",
      value: branches.length,
      icon: <FiLayers />,
      color: "blue",
      gradient: "from-blue-600 to-cyan-500",
      description: "Hospital branches",
    },

    {
      key: "departments",
      title: "Departments",
      value: departments.length,
      icon: <FiActivity />,
      color: "purple",
      gradient: "from-violet-600 to-purple-500",
      description: "Hospital departments",
    },

    {
      key: "doctors",
      title: "Doctors",
      value: doctors.length,
      icon: <FiUserCheck />,
      color: "green",
      gradient: "from-emerald-600 to-green-500",
      description: "Doctors in your hospital",
    },

    {
      key: "nurses",
      title: "Nurses",
      value: nurses.length,
      icon: <FiHeart />,
      color: "pink",
      gradient: "from-pink-600 to-rose-500",
      description: "Nursing staff",
    },

    {
      key: "labTechnicians",
      title: "Lab Technicians",
      value: labTechnicians.length,
      icon: <FiDroplet />,
      color: "cyan",
      gradient: "from-cyan-600 to-sky-500",
      description: "Laboratory staff",
    },

    {
      key: "pharmacists",
      title: "Pharmacists",
      value: pharmacists.length,
      icon: <FiShoppingCart />,
      color: "orange",
      gradient: "from-orange-600 to-amber-500",
      description: "Pharmacy staff",
    },

    {
      key: "receptionists",
      title: "Receptionists",
      value: receptionists.length,
      icon: <FiUserPlus />,
      color: "indigo",
      gradient: "from-indigo-600 to-blue-500",
      description: "Front desk staff",
    },

    {
      key: "patients",
      title: "Patients",
      value: patients.length,
      icon: <FiUsers />,
      color: "blue",
      gradient: "from-blue-600 to-cyan-500",
      description: "Registered patients",
    },

    {
      key: "appointments",
      title: "Appointments",
      value: todayAppointments.length,
      icon: <FiCalendar />,
      color: "green",
      gradient: "from-emerald-600 to-green-500",
      description: "Hospital appointments",
    },

    {
      key: "revenue",
      title: "Daily Revenue",
      value: `₹${dailyRevenue.toLocaleString("en-IN")}`,
      icon: <FiDollarSign />,
      color: "purple",
      gradient: "from-violet-600 to-purple-500",
      description: "Today's revenue",
    },
  ];

  // =======================================================
  // DETAIL DATA
  // =======================================================

  const detailData = useMemo(() => {
    if (!activeCard) {
      return [];
    }

    switch (activeCard) {
      case "branches":
        return branches;

      case "departments":
        return departments;

      case "doctors":
        return doctors;

      case "nurses":
        return nurses;

      case "labTechnicians":
        return labTechnicians;

      case "pharmacists":
        return pharmacists;

      case "receptionists":
        return receptionists;

      case "patients":
        return patients;

      case "appointments":
        return appointmentData;

      default:
        return [];
    }
  }, [
    activeCard,
    branches,
    departments,
    doctors,
    nurses,
    labTechnicians,
    pharmacists,
    receptionists,
    patients,
    appointmentData,
  ]);

  // =======================================================
  // FILTERED DATA
  // =======================================================

  const filteredData = useMemo(() => {
    return detailData.filter((item) => {
      const searchableText = JSON.stringify(item).toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search.toLowerCase());

      const status = String(
        item?.status ||
          (item?.is_active === true
            ? "active"
            : item?.is_active === false
              ? "inactive"
              : ""),
      ).toLowerCase();

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const dateValue =
        item?.created_at ||
        item?.createdAt ||
        item?.appointment_date ||
        item?.date ||
        "";

      const itemDate = String(dateValue).slice(0, 10);

      const matchesFrom =
        !fromDate || (Boolean(itemDate) && itemDate >= fromDate);

      const matchesTo = !toDate || (Boolean(itemDate) && itemDate <= toDate);

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [detailData, search, statusFilter, fromDate, toDate]);

  // =======================================================
  // EXPORT EXCEL
  // =======================================================

  const exportExcel = () => {
    if (!filteredData.length) {
      toast.error("Export ke liye data available nahi hai.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      String(activeCard || "Data").slice(0, 31),
    );

    XLSX.writeFile(workbook, `${activeCard || "hospital-data"}.xlsx`);

    toast.success("Excel file successfully export ho gayi.");
  };

  // =======================================================
  // EXPORT PDF
  // =======================================================

  const exportPDF = () => {
    if (!filteredData.length) {
      toast.error("Export ke liye data available nahi hai.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`${hospitalName} - ${activeCard || "Hospital Data"}`, 14, 15);

    const rows = filteredData.map((item) => [
      item?.id || "-",
      item?.name ||
        item?.patient_name ||
        item?.doctor_name ||
        item?.username ||
        "-",
      item?.status || (item?.is_active ? "Active" : "-"),
    ]);

    autoTable(doc, {
      head: [["ID", "Name", "Status"]],
      body: rows,
      startY: 25,
    });

    doc.save(`${activeCard || "hospital-data"}.pdf`);

    toast.success("PDF successfully export ho gayi.");
  };

  // =======================================================
  // DETAIL VIEW
  // =======================================================

  if (activeCard) {
    const card = dashboardCards.find((item) => item.key === activeCard);

    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveCard(null);
                setSearch("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg border bg-white hover:bg-gray-50"
            >
              <FiArrowLeft />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {card?.title || "Details"}
              </h1>

              <p className="text-sm text-gray-500">
                {hospitalName} • {card?.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => loadDashboard(false)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* FILTERS */}

        <div className="bg-white border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${card?.title || "data"}...`}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-lg px-3">
              <FiFilter className="text-gray-400" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 outline-none bg-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-2.5"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-2.5"
            />

            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              <FiDownload />
              Excel
            </button>

            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              <FiDownload />
              PDF
            </button>
          </div>
        </div>

        {/* DATA TABLE */}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">
                {card?.title} List
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {filteredData.length} records
              </p>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
              }}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3">ID</th>

                  <th className="text-left px-5 py-3">Name</th>

                  <th className="text-left px-5 py-3">Status</th>

                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => {
                  const name =
                    item?.name ||
                    item?.patient_name ||
                    item?.doctor_name ||
                    item?.username ||
                    item?.user?.name ||
                    item?.user?.username ||
                    "-";

                  const date =
                    item?.created_at ||
                    item?.createdAt ||
                    item?.appointment_date ||
                    item?.date ||
                    "-";

                  const status =
                    item?.status || (item?.is_active ? "Active" : "-");

                  return (
                    <tr
                      key={item?.id || `${activeCard}-${index}`}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-5 py-3">{item?.id || "-"}</td>

                      <td className="px-5 py-3 font-medium text-gray-800">
                        {name}
                      </td>

                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100">
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-gray-500">
                        {String(date).slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!filteredData.length && (
              <div className="py-12 text-center text-gray-500">
                No records found.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // MAIN DASHBOARD
  // =======================================================

  return (
    <div className="space-y-6">
      {/* PREMIUM HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Hospital Admin Dashboard
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {hospitalName}
            </h1>

            <p className="mt-2 text-sm text-blue-100/80">
              Welcome, {user?.name || "Hospital Admin"}
            </p>

            {hospital?.hospital_code && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-blue-100">
                <FiHome />
                Hospital Code: {hospital.hospital_code}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              onClick={() => loadDashboard(false)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={loading ? "..." : patients.length}
          icon={<FiUsers />}
          color="blue"
        />

        <StatCard
          title="Doctors"
          value={loading ? "..." : doctors.length}
          icon={<FiUserCheck />}
          color="green"
        />

        <StatCard
          title="Departments"
          value={loading ? "..." : departments.length}
          icon={<FiLayers />}
          color="purple"
        />

        <StatCard
          title="Today's Appointments"
          value={loading ? "..." : todayAppointments.length}
          icon={<FiCalendar />}
          color="orange"
        />
      </div>

      {/* OPERATIONS */}
      <section>
        <div className="mb-4">
          <h2 className="mt-1 text-xl font-bold text-slate-800">
            Manage your hospital resources
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {dashboardCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => card.key !== "revenue" && setActiveCard(card.key)}
              className={`group text-left ${
                card.key === "revenue" ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <div
                className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl`}
              >
                <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {card.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold">
                        {loading ? "..." : card.value}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl text-white">
                      {card.icon}
                    </div>
                  </div>
                  <p className="mt-5 text-xs text-white/75">
                    {card.description}
                  </p>
                  {card.key !== "revenue" && (
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
                      View details{" "}
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ANALYTICS */}
      <section>
        <div className="mb-4">
          <h2 className="mt-1 text-xl font-bold text-slate-800">
            Hospital performance
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-semibold text-slate-800">
                Staff Distribution
              </h3>
              <p className="mt-1 text-xs text-slate-500">Staff count by role</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffChartData} barCategoryGap="28%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Staff" radius={[8, 8, 0, 0]}>
                    {staffChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-semibold text-slate-800">
                Hospital Resources
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Current resource count
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceChartData} barCategoryGap="28%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Resources" radius={[8, 8, 0, 0]}>
                    {resourceChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-semibold text-slate-800">Monthly Revenue</h3>
              <p className="mt-1 text-xs text-slate-500">
                Paid billing records for the current year
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient
                      id="hospitalAdminRevenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value || 0).toLocaleString("en-IN")}`
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#hospitalAdminRevenueFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-semibold text-slate-800">
                Patient Registration Trend
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Monthly patient registrations
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientMonthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    name="Patients"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Appointment Activity
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Appointments over the last 7 days
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Today: {todayAppointments.length}
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appointmentTrendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    name="Appointments"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY PANELS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Staff Overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Staff currently associated with your hospital
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiUsers />
            </div>
          </div>

          <div className="space-y-3">
            <SummaryRow
              label="Doctors"
              value={doctors.length}
              icon={<FiUserCheck />}
            />

            <SummaryRow
              label="Nurses"
              value={nurses.length}
              icon={<FiHeart />}
            />

            <SummaryRow
              label="Lab Technicians"
              value={labTechnicians.length}
              icon={<FiDroplet />}
            />

            <SummaryRow
              label="Pharmacists"
              value={pharmacists.length}
              icon={<FiShoppingCart />}
            />

            <SummaryRow
              label="Receptionists"
              value={receptionists.length}
              icon={<FiUserPlus />}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Hospital Overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Current resources and financial snapshot
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiHome />
            </div>
          </div>

          <div className="space-y-3">
            <SummaryRow
              label="Branches"
              value={branches.length}
              icon={<FiLayers />}
            />

            <SummaryRow
              label="Departments"
              value={departments.length}
              icon={<FiActivity />}
            />

            <SummaryRow
              label="Patients"
              value={patients.length}
              icon={<FiUsers />}
            />

            <SummaryRow
              label="Appointments"
              value={totalAppointments}
              icon={<FiCalendar />}
            />

            <SummaryRow
              label="Daily Revenue"
              value={`₹${dailyRevenue.toLocaleString("en-IN")}`}
              icon={<FiDollarSign />}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => loadDashboard(false)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>
    </div>
  );
}

// =========================================================
// SUMMARY ROW
// =========================================================

function SummaryRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white border flex items-center justify-center text-gray-500">
          {icon}
        </div>

        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>

      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}

export default HospitalAdminDashboard;
