import React from 'react';
import { useSelector } from 'react-redux';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiUsers, FiCalendar, FiDollarSign, FiLayers, FiHeart, FiAlertTriangle, FiDroplet, FiShoppingCart, FiTrendingUp, FiArrowRight, FiFileText, FiClock } from 'react-icons/fi';
import { statsData, recentPatients, appointments, revenueData, patientFlowData, bedOccupancy, departments } from '../../utils/mockData';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const { role, user } = useSelector(state => state.auth);

  if (role === 'doctor') return <DoctorDashboard user={user} />;
  if (role === 'patient') return <PatientDashboard user={user} />;
  if (role === 'receptionist') return <ReceptionistDashboard user={user} />;
  if (role === 'nurse') return <NurseDashboard user={user} />;
  if (role === 'lab_technician') return <LabTechnicianDashboard user={user} />;
  if (role === 'pharmacist') return <PharmacistDashboard user={user} />;
  if (role === 'accountant') return <AccountantDashboard user={user} />;

  // super_admin, hospital_admin
  return <AdminDashboard user={user} />;
}

/* ---------------- Nurse ---------------- */
function NurseDashboard({ user }) {
  return (
    <div>
      <PageHeader title="Nurse Dashboard" subtitle={`Welcome, ${user?.name || 'Nurse'}. Patient monitoring and bed allocation.`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Patients Under Care" value={18} icon={<FiUsers />} color="blue" />
        <StatCard title="Bed Occupancy" value={`${statsData.bedOccupancy}%`} icon={<FiLayers />} color="green" />
        <StatCard title="Emergency Cases" value={statsData.emergencyCases} icon={<FiAlertTriangle />} color="red" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Ward Overview</h3>
        <p className="text-sm text-gray-500 mb-4">Current bed status</p>
        <div className="grid grid-cols-2 gap-3">
          {bedOccupancy.slice(0, 4).map(ward => (
            <div key={ward.ward} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{ward.ward}</span>
              <span className="text-sm text-gray-500">{ward.occupied}/{ward.total} beds</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Lab Technician ---------------- */
function LabTechnicianDashboard({ user }) {
  return (
    <div>
      <PageHeader title="Lab Dashboard" subtitle={`Welcome, ${user?.name || 'Lab Technician'}. Manage tests and upload reports.`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Tests Today" value={statsData.labTestsToday} icon={<FiDroplet />} color="blue" />
        <StatCard title="Pending Reports" value={6} icon={<FiFileText />} color="orange" />
        <StatCard title="Reports Uploaded" value={22} icon={<FiClock />} color="green" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Recent Test Orders</h3>
        <p className="text-sm text-gray-500 mb-4">Awaiting sample collection or results</p>
        <div className="space-y-3">
          {recentPatients.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.department}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pharmacist ---------------- */
function PharmacistDashboard({ user }) {
  return (
    <div>
      <PageHeader title="Pharmacy Dashboard" subtitle={`Welcome, ${user?.name || 'Pharmacist'}. Inventory control and medicine billing.`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Orders Today" value={statsData.pharmacyOrders} icon={<FiShoppingCart />} color="blue" />
        <StatCard title="Low Stock Items" value={7} icon={<FiPackage />} color="red" />
        <StatCard title="Bills Generated" value={31} icon={<FiDollarSign />} color="green" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Department Medicine Demand</h3>
        <p className="text-sm text-gray-500 mb-4">Based on recent prescriptions</p>
        <div className="space-y-4">
          {departments.slice(0, 5).map((dept, idx) => (
            <div key={dept.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{dept.icon} {dept.name}</span>
                <span className="text-sm text-gray-500">₹{(dept.revenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${(dept.revenue / 520000) * 100}%`, backgroundColor: COLORS[idx] }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Accountant ---------------- */
function AccountantDashboard({ user }) {
  return (
    <div>
      <PageHeader title="Finance Dashboard" subtitle={`Welcome, ${user?.name || 'Accountant'}. Billing and revenue tracking.`} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Daily Revenue" value={`₹${(statsData.dailyRevenue / 1000).toFixed(0)}K`} icon={<FiDollarSign />} change="15%" changeType="up" color="purple" />
        <StatCard title="Pending Bills" value={14} icon={<FiFileText />} color="orange" />
        <StatCard title="Bills Cleared Today" value={38} icon={<FiClock />} color="green" />
        <StatCard title="Insurance Claims" value={9} icon={<FiLayers />} color="blue" />
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
            <p className="text-sm text-gray-500">Monthly revenue vs expenses</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
            <Tooltip formatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
            <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#revenueGrad2)" strokeWidth={2} name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------- Doctor ---------------- */
function DoctorDashboard({ user }) {
  const myAppointments = appointments.slice(0, 5);

  return (
    <div>
      <PageHeader title="Doctor Dashboard" subtitle={`Welcome back, ${user?.name || 'Doctor'}. Here's your day at a glance.`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Patients" value={myAppointments.length} icon={<FiUsers />} color="blue" />
        <StatCard title="Prescriptions Issued" value={9} icon={<FiFileText />} color="green" />
        <StatCard title="Follow-Ups Due" value={5} icon={<FiClock />} color="purple" />
        <StatCard title="Emergency Cases" value={statsData.emergencyCases} icon={<FiAlertTriangle />} color="red" />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Today's Patients</h3>
        <p className="text-sm text-gray-500 mb-4">Your scheduled consultations</p>
        <div className="space-y-3">
          {myAppointments.map(apt => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-medicore-100 rounded-full flex items-center justify-center">
                  <span className="text-medicore-700 text-sm font-medium">{apt.patient.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{apt.patient}</p>
                  <p className="text-xs text-gray-500">{apt.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{apt.time}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{apt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Patient ---------------- */
function PatientDashboard({ user }) {
  const myAppointments = appointments.slice(0, 3);

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle={`Welcome, ${user?.name || 'Patient'}. Here's your care summary.`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Upcoming Appointments" value={myAppointments.length} icon={<FiCalendar />} color="blue" />
        <StatCard title="Medical Reports" value={4} icon={<FiFileText />} color="green" />
        <StatCard title="Active Prescriptions" value={2} icon={<FiHeart />} color="purple" />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Your Appointments</h3>
        <p className="text-sm text-gray-500 mb-4">Upcoming and recent visits</p>
        <div className="space-y-3">
          {myAppointments.map(apt => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{apt.doctor}</p>
                <p className="text-xs text-gray-500">{apt.department}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{apt.time}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{apt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Receptionist ---------------- */
function ReceptionistDashboard({ user }) {
  return (
    <div>
      <PageHeader
        title="Front Desk"
        subtitle={`Welcome, ${user?.name || 'Receptionist'}. Manage registrations and appointments here.`}
        action={
          <button className="btn-primary text-sm">
            <span className="flex items-center gap-2">
              <FiUsers size={16} /> Register Patient
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Registrations" value={12} icon={<FiUsers />} color="blue" />
        <StatCard title="Appointments Today" value={statsData.todayAppointments} icon={<FiCalendar />} color="green" />
        <StatCard title="Waiting Now" value={7} icon={<FiClock />} color="orange" />
        <StatCard title="Emergency Cases" value={statsData.emergencyCases} icon={<FiAlertTriangle />} color="red" />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Today's Appointments</h3>
        <p className="text-sm text-gray-500 mb-4">{appointments.length} appointments scheduled</p>
        <div className="space-y-3">
          {appointments.slice(0, 6).map(apt => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{apt.patient}</p>
                <p className="text-xs text-gray-500">{apt.doctor} • {apt.department}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{apt.time}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                  apt.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' :
                  apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{apt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Admin / Super Admin (original) ---------------- */
function AdminDashboard() {
  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening at your hospital today."
        action={
          <div className="flex items-center gap-3">
            <select className="input-field w-40 py-2 text-sm">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <button className="btn-primary text-sm">
              <span className="flex items-center gap-2">
                <FiTrendingUp size={16} /> Generate Report
              </span>
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Patients" value={statsData.totalPatients.toLocaleString()} icon={<FiUsers />} change="12%" changeType="up" color="blue" />
        <StatCard title="Today's Appointments" value={statsData.todayAppointments} icon={<FiCalendar />} change="8%" changeType="up" color="green" />
        <StatCard title="Daily Revenue" value={`₹${(statsData.dailyRevenue / 1000).toFixed(0)}K`} icon={<FiDollarSign />} change="15%" changeType="up" color="purple" />
        <StatCard title="Bed Occupancy" value={`${statsData.bedOccupancy}%`} icon={<FiLayers />} change="3%" changeType="down" color="orange" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Doctors Available" value={statsData.doctorsAvailable} icon={<FiHeart />} color="cyan" />
        <StatCard title="Emergency Cases" value={statsData.emergencyCases} icon={<FiAlertTriangle />} color="red" />
        <StatCard title="Lab Tests Today" value={statsData.labTestsToday} icon={<FiDroplet />} color="yellow" />
        <StatCard title="Pharmacy Orders" value={statsData.pharmacyOrders} icon={<FiShoppingCart />} color="pink" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Monthly revenue vs expenses</p>
            </div>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bed Occupancy Pie */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Bed Occupancy</h3>
          <p className="text-sm text-gray-500 mb-4">Current ward status</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bedOccupancy} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="occupied" nameKey="ward" label={({ ward, occupied, total }) => `${ward.split(' ')[0]}: ${occupied}/${total}`} labelLine={false}>
                {bedOccupancy.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {bedOccupancy.slice(0, 4).map((ward, idx) => (
              <div key={ward.ward} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                <span className="text-xs text-gray-600">{ward.ward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Flow + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Patient Flow */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Patient Flow</h3>
              <p className="text-sm text-gray-500">Weekly patient visits</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={patientFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="opd" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="OPD" />
              <Bar dataKey="ipd" fill="#10b981" radius={[4, 4, 0, 0]} name="IPD" />
              <Bar dataKey="emergency" fill="#ef4444" radius={[4, 4, 0, 0]} name="Emergency" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Today's Appointments</h3>
              <p className="text-sm text-gray-500">{appointments.length} appointments scheduled</p>
            </div>
            <a href="/appointments" className="text-sm text-medicore-600 hover:text-medicore-700 font-medium flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </a>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {appointments.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medicore-100 rounded-full flex items-center justify-center">
                    <span className="text-medicore-700 text-sm font-medium">{apt.patient.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{apt.patient}</p>
                    <p className="text-xs text-gray-500">{apt.doctor} • {apt.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{apt.time}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' :
                    apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{apt.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Patients + Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients Table */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Recent Patients</h3>
              <p className="text-sm text-gray-500">Latest registered patients</p>
            </div>
            <a href="/patients" className="text-sm text-medicore-600 hover:text-medicore-700 font-medium flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPatients.slice(0, 6).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-medicore-600">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{p.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.age} yrs, {p.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.department}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.status === 'Active' ? 'bg-green-100 text-green-700' :
                        p.status === 'Discharged' ? 'bg-gray-100 text-gray-700' :
                        p.status === 'Critical' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Department Revenue</h3>
          <p className="text-sm text-gray-500 mb-4">Monthly performance</p>
          <div className="space-y-4">
            {departments.slice(0, 6).map((dept, idx) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{dept.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">₹{(dept.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(dept.revenue / 520000) * 100}%`, backgroundColor: COLORS[idx] }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}