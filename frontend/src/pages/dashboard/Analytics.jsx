
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  FiDownload,
  FiRefreshCw,
  FiUsers,
  FiHome,
  FiActivity,
  FiDollarSign,
} from "react-icons/fi";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import PageHeader from "../../components/common/PageHeader";

import { dashboardApi } from "../../api/service";

import {
  revenueData,
  patientFlowData,
  departments,
  bedOccupancy,
} from "../../utils/mockData";


// =========================================================
// HELPERS
// =========================================================

const normalizeList = (response) => {

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.results
    )
  ) {
    return response.data.results;
  }

  return [];
};


const getPatientDate = (patient) =>
  patient?.created_at ||
  patient?.createdAt ||
  patient?.date_joined ||
  patient?.registration_date ||
  patient?.date ||
  null;


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


// =========================================================
// MOCK DATA
// =========================================================
//
// APIs not ready:
// Appointment
// Doctor
// Nurse
// Billing
//
// =========================================================

const mockAppointmentAnalytics = [
  {
    month: "Jan",
    appointments: 420,
  },
  {
    month: "Feb",
    appointments: 510,
  },
  {
    month: "Mar",
    appointments: 580,
  },
  {
    month: "Apr",
    appointments: 630,
  },
  {
    month: "May",
    appointments: 720,
  },
  {
    month: "Jun",
    appointments: 680,
  },
  {
    month: "Jul",
    appointments: 790,
  },
  {
    month: "Aug",
    appointments: 850,
  },
  {
    month: "Sep",
    appointments: 920,
  },
  {
    month: "Oct",
    appointments: 980,
  },
];


// =========================================================
// ANALYTICS
// =========================================================

export default function Analytics() {

  const [
    patients,
    setPatients,
  ] = useState([]);

  const [
    hospitals,
    setHospitals,
  ] = useState([]);

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  // =======================================================
  // LIVE API LOAD
  // =======================================================

  const loadAnalytics = async (
    initial = false
  ) => {

    try {

      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }


      /*
       * ================================================
       * REAL APIs
       * ================================================
       */

      const [
        patientResponse,
        hospitalResponse,
        branchResponse,
      ] = await Promise.all([
        dashboardApi.patients(),
        dashboardApi.hospitals(),
        dashboardApi.branches(),
      ]);


      setPatients(
        normalizeList(
          patientResponse
        )
      );

      setHospitals(
        normalizeList(
          hospitalResponse
        )
      );

      setBranches(
        normalizeList(
          branchResponse
        )
      );
    
      

    } catch (error) {

      console.error(
        "Analytics error:",
        error
      );

      toast.error(
        "Analytics live data load nahi ho paya."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  useEffect(() => {

    loadAnalytics(true);

    const interval =
      setInterval(() => {
        loadAnalytics(false);
      }, 30000);

    return () =>
      clearInterval(interval);

  }, []);


  // =======================================================
  // REAL PATIENT TRENDS
  // =======================================================

  const monthlyPatients =
    useMemo(() => {

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

      return months.map(
        (
          month,
          monthIndex
        ) => {

          const count =
            patients.filter(
              (patient) => {

                const date =
                  getPatientDate(
                    patient
                  );

                if (!date) {
                  return false;
                }

                const parsed =
                  new Date(date);

                return (
                  parsed.getMonth() ===
                  monthIndex
                );

              }
            ).length;

          return {
            month,
            patients: count,
          };

        }
      );

    }, [patients]);


  // =======================================================
  // REAL ORGANIZATION
  // =======================================================

  const organizationData = [
    {
      name: "Hospitals",
      value: hospitals.length,
    },
    {
      name: "Branches",
      value: branches.length,
    },
  ];


  // =======================================================
  // REAL METRICS
  // =======================================================

  const totalPatients =
    patients.length;

  const totalHospitals =
    hospitals.length;

  const totalBranches =
    branches.length;


  // =======================================================
  // EXPORT EXCEL
  // =======================================================

  const exportExcel = () => {

    const data = [
      {
        Metric: "Total Patients",
        Value: totalPatients,
      },
      {
        Metric: "Total Hospitals",
        Value: totalHospitals,
      },
      {
        Metric: "Total Branches",
        Value: totalBranches,
      },
    ];

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Analytics"
    );

    XLSX.writeFile(
      workbook,
      "analytics-report.xlsx"
    );

    toast.success(
      "Excel exported."
    );
  };


  // =======================================================
  // EXPORT PDF
  // =======================================================

  const exportPDF = () => {

    const doc =
      new jsPDF();

    doc.text(
      "Hospital Analytics Report",
      14,
      15
    );

    autoTable(doc, {
      startY: 25,

      head: [
        [
          "Metric",
          "Value",
        ],
      ],

      body: [
        [
          "Total Patients",
          totalPatients,
        ],
        [
          "Total Hospitals",
          totalHospitals,
        ],
        [
          "Total Branches",
          totalBranches,
        ],
      ],
    });

    doc.save(
      "analytics-report.pdf"
    );

    toast.success(
      "PDF exported."
    );
  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (
      <div>

        <PageHeader
          title="Analytics & Reports"
          subtitle="Hospital performance insights"
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

          {[1, 2, 3, 4].map(
            (item) => (

              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-gray-200"
              />

            )
          )}

        </div>

      </div>
    );
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <div>

      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive hospital performance insights and real-time analytics"
        action={
          <div className="flex gap-3">

            <button
              onClick={() =>
                loadAnalytics(false)
              }
              className="btn-primary text-sm"
            >

              <span className="flex items-center gap-2">

                <FiRefreshCw
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh

              </span>

            </button>


            <button
              onClick={exportExcel}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
            >

              <FiDownload />

              Excel

            </button>


            <button
              onClick={exportPDF}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
            >

              <FiDownload />

              PDF

            </button>

          </div>
        }
      />


      {/* =================================================
          DATA STATUS
      ================================================= */}

      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">

        <strong className="text-blue-800">
          Live APIs:
        </strong>

        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
          Patients
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
          Hospitals
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
          Branches
        </span>

        <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
          Other Charts = Temporary Data
        </span>

      </div>


      {/* =================================================
          KEY METRICS
      ================================================= */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">


        <AnalyticsMetric
          title="Total Patients"
          value={
            totalPatients
          }
          icon={<FiUsers />}
          gradient="from-emerald-600 to-green-500"
        />


        <AnalyticsMetric
          title="Total Hospitals"
          value={
            totalHospitals
          }
          icon={<FiHome />}
          gradient="from-violet-600 to-purple-500"
        />


        <AnalyticsMetric
          title="Total Branches"
          value={
            totalBranches
          }
          icon={<FiActivity />}
          gradient="from-blue-600 to-cyan-500"
        />


        <AnalyticsMetric
          title="Revenue"
          value="₹1.85 Cr"
          icon={<FiDollarSign />}
          gradient="from-orange-600 to-amber-500"
          mock
        />

      </div>


      {/* =================================================
          REVENUE VS EXPENSES
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">


        <div className="card">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h3 className="text-lg font-semibold text-gray-800">
                Revenue vs Expenses
              </h3>

              <p className="text-sm text-gray-500">
                Monthly financial performance
              </p>

            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
              Billing API Pending
            </span>

          </div>


          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <AreaChart
              data={revenueData}
            >

              <defs>

                <linearGradient
                  id="analyticsRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#0ea5e9"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="95%"
                    stopColor="#0ea5e9"
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>


              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />

              <XAxis
                dataKey="month"
              />

              <YAxis
                tickFormatter={(v) =>
                  `${(
                    v / 100000
                  ).toFixed(0)}L`
                }
              />

              <Tooltip
                formatter={(v) =>
                  `₹${(
                    v / 100000
                  ).toFixed(1)}L`
                }
              />

              <Legend />


              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                fill="url(#analyticsRevenue)"
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


        {/* =================================================
            REAL PATIENT TRENDS
        ================================================= */}

        <div className="card">

          <div className="mb-4">

            <h3 className="text-lg font-semibold text-gray-800">
              Patient Trends (Monthly)
            </h3>

            <p className="text-sm text-gray-500">
              Live data from Patient API
            </p>

          </div>


          {monthlyPatients.some(
            (item) =>
              item.patients > 0
          ) ? (

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <LineChart
                data={
                  monthlyPatients
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                />

                <XAxis
                  dataKey="month"
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  name="Patients"
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">

              Patient API me date field available nahi hai.

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          DEPARTMENT + ORGANIZATION
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">


        {/* DEPARTMENT */}

        <div className="lg:col-span-2 card">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h3 className="text-lg font-semibold text-gray-800">
                Department Performance
              </h3>

              <p className="text-sm text-gray-500">
                Temporary department revenue data
              </p>

            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
              Mock
            </span>

          </div>


          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <BarChart
              data={departments}
              layout="vertical"
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />

              <XAxis
                type="number"
                tickFormatter={(v) =>
                  `${(
                    v / 1000
                  ).toFixed(0)}K`
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                width={90}
              />

              <Tooltip
                formatter={(v) =>
                  `₹${(
                    v / 1000
                  ).toFixed(0)}K`
                }
              />


              <Bar
                dataKey="revenue"
                radius={[
                  0,
                  4,
                  4,
                  0,
                ]}
              >

                {departments.map(
                  (_, idx) => (

                    <Cell
                      key={idx}
                      fill={
                        COLORS[
                          idx %
                            COLORS.length
                        ]
                      }
                    />

                  )
                )}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>


        {/* REAL HOSPITAL / BRANCH */}

        <div className="card">

          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Hospital & Branch
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Live API data
          </p>


          {organizationData.some(
            (item) =>
              item.value > 0
          ) ? (

            <ResponsiveContainer
              width="100%"
              height={240}
            >

              <PieChart>

                <Pie
                  data={
                    organizationData
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label
                >

                  {organizationData.map(
                    (entry, idx) => (

                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          COLORS[idx]
                        }
                      />

                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex h-[240px] items-center justify-center text-sm text-gray-400">
              No live organization data.
            </div>

          )}

        </div>

      </div>


      {/* =================================================
          WEEKLY PATIENT FLOW
      ================================================= */}

      <div className="card mb-6">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h3 className="text-lg font-semibold text-gray-800">
              Weekly Patient Flow
            </h3>

            <p className="text-sm text-gray-500">
              OPD, IPD and Emergency
            </p>

          </div>

          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
            API Pending
          </span>

        </div>


        <ResponsiveContainer
          width="100%"
          height={250}
        >

          <BarChart
            data={patientFlowData}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />

            <XAxis
              dataKey="day"
            />

            <YAxis />

            <Tooltip />

            <Legend />


            <Bar
              dataKey="opd"
              fill="#0ea5e9"
              radius={[
                4,
                4,
                0,
                0,
              ]}
              stackId="a"
              name="OPD"
            />

            <Bar
              dataKey="ipd"
              fill="#10b981"
              radius={[
                4,
                4,
                0,
                0,
              ]}
              stackId="a"
              name="IPD"
            />

            <Bar
              dataKey="emergency"
              fill="#ef4444"
              radius={[
                4,
                4,
                0,
                0,
              ]}
              stackId="a"
              name="Emergency"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>


      {/* =================================================
          BED OCCUPANCY
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">


        <div className="card">

          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Bed Occupancy
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Temporary data until IPD/Bed API
          </p>


          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <PieChart>

              <Pie
                data={bedOccupancy}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                dataKey="occupied"
                nameKey="ward"
              >

                {bedOccupancy.map(
                  (_, idx) => (

                    <Cell
                      key={idx}
                      fill={
                        COLORS[
                          idx %
                            COLORS.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>


        {/* APPOINTMENT ANALYTICS */}

        <div className="card">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h3 className="text-lg font-semibold text-gray-800">
                Appointment Trend
              </h3>

              <p className="text-sm text-gray-500">
                Temporary data until Appointment API
              </p>

            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
              Mock
            </span>

          </div>


          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              data={
                mockAppointmentAnalytics
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="appointments"
                fill="#f59e0b"
                radius={[
                  5,
                  5,
                  0,
                  0,
                ]}
                name="Appointments"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}


// =========================================================
// ANALYTICS METRIC
// =========================================================

function AnalyticsMetric({
  title,
  value,
  icon,
  gradient,
  mock = false,
}) {

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
    >

      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative">

        <div className="mb-5 flex items-center justify-between">

          <div className="rounded-xl bg-white/20 p-3">
            {icon}
          </div>

          {mock && (
            <span className="rounded-full bg-white/20 px-2 py-1 text-[10px]">
              MOCK
            </span>
          )}

        </div>

        <p className="text-sm text-white/80">
          {title}
        </p>

        <h2 className="mt-1 text-3xl font-bold">
          {value}
        </h2>

      </div>

    </div>
  );
}