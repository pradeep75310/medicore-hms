import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { revenueData, patientFlowData, departments, bedOccupancy } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const monthlyPatients = [
  { month: 'Jan', opd: 4200, ipd: 850, emergency: 320 },
  { month: 'Feb', opd: 4500, ipd: 920, emergency: 280 },
  { month: 'Mar', opd: 4800, ipd: 880, emergency: 350 },
  { month: 'Apr', opd: 5100, ipd: 950, emergency: 310 },
  { month: 'May', opd: 5400, ipd: 1020, emergency: 290 },
  { month: 'Jun', opd: 5000, ipd: 980, emergency: 380 },
  { month: 'Jul', opd: 5600, ipd: 1100, emergency: 340 },
  { month: 'Aug', opd: 5300, ipd: 1050, emergency: 360 },
];

const satisfactionData = [
  { name: 'Excellent', value: 45, color: '#10b981' },
  { name: 'Good', value: 30, color: '#0ea5e9' },
  { name: 'Average', value: 15, color: '#f59e0b' },
  { name: 'Poor', value: 10, color: '#ef4444' },
];

export default function Analytics() {
  return (
    <div>
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="Comprehensive hospital performance insights and real-time analytics"
        action={
          <div className="flex gap-3">
            <select className="input-field w-36 py-2 text-sm">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <button className="btn-primary text-sm">Download Report</button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue (YTD)', value: '₹1.85 Cr', change: '+18%', up: true },
          { label: 'Patient Satisfaction', value: '4.6/5.0', change: '+0.3', up: true },
          { label: 'Avg Wait Time', value: '12 min', change: '-3 min', up: true },
          { label: 'Bed Utilization', value: '78%', change: '+5%', up: true },
        ].map(m => (
          <div key={m.label} className="stat-card">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{m.value}</p>
            <p className={`text-xs mt-1 font-medium ${m.up ? 'text-green-600' : 'text-red-600'}`}>{m.change} vs last period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue vs Expenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="aRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#aRev)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Trends (Monthly)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyPatients}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opd" stroke="#0ea5e9" strokeWidth={2} name="OPD" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ipd" stroke="#10b981" strokeWidth={2} name="IPD" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="emergency" stroke="#ef4444" strokeWidth={2} name="Emergency" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Department Performance */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departments} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
              <Tooltip formatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {departments.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Satisfaction */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Satisfaction</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={satisfactionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`}>
                {satisfactionData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {satisfactionData.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-xs text-gray-600">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Flow */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Patient Flow</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={patientFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="opd" fill="#0ea5e9" radius={[4, 4, 0, 0]} stackId="a" name="OPD" />
            <Bar dataKey="ipd" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" name="IPD" />
            <Bar dataKey="emergency" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" name="Emergency" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
