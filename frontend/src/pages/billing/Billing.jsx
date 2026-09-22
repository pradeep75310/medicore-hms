import React, { useState } from 'react';
import { FiSearch, FiPlus, FiDownload, FiDollarSign, FiTrendingUp, FiCreditCard, FiFileText } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { billingData, revenueData } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

const paymentMethods = [
  { name: 'UPI', value: 35, color: '#0ea5e9' },
  { name: 'Cash', value: 25, color: '#10b981' },
  { name: 'Card', value: 20, color: '#8b5cf6' },
  { name: 'Insurance', value: 20, color: '#f59e0b' },
];

export default function Billing() {
  return (
    <div>
      <PageHeader 
        title="Billing & Finance" 
        subtitle="Invoice generation, insurance billing, and revenue analytics"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2"><FiDownload size={16} /> Export</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> New Invoice</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today\'s Revenue', value: '₹2.45L', change: '+12%', color: 'bg-green-500' },
          { label: 'Pending Invoices', value: '₹1.82L', change: '23 pending', color: 'bg-yellow-500' },
          { label: 'Insurance Claims', value: '₹5.6L', change: '8 active', color: 'bg-blue-500' },
          { label: 'Monthly Revenue', value: '₹24.5L', change: '+18%', color: 'bg-purple-500' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1">{stat.change}</p>
              </div>
              <div className={`w-2 h-12 rounded-full ${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {paymentMethods.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {paymentMethods.map(m => (
              <div key={m.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></div>
                <span className="text-xs text-gray-600">{m.name} ({m.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Invoices</h3>
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" size={16} />
            <input type="text" placeholder="Search invoices..." className="bg-transparent border-none outline-none ml-2 text-sm w-40" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingData.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-medicore-600">{bill.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{bill.patient}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{bill.type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{bill.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="badge-info">{bill.method}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      bill.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      bill.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{bill.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{bill.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100">View</button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Print</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
