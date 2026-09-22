import React, { useState } from 'react';
import { FiSearch, FiPlus, FiAlertTriangle, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { pharmacyItems } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Pharmacy() {
  return (
    <div>
      <PageHeader 
        title="Pharmacy Management" 
        subtitle="Inventory tracking, batch management, and medicine dispensing"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm">Purchase Order</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> Add Medicine</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Medicines', value: '2,450', icon: <FiPackage />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Low Stock Alerts', value: '18', icon: <FiAlertTriangle />, color: 'bg-red-50 text-red-600' },
          { label: 'Today\'s Dispensed', value: '134', icon: <FiTrendingUp />, color: 'bg-green-50 text-green-600' },
          { label: 'Expiring Soon', value: '7', icon: <FiAlertTriangle />, color: 'bg-yellow-50 text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Medicine Inventory</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <FiSearch className="text-gray-400" size={16} />
              <input type="text" placeholder="Search medicines..." className="bg-transparent border-none outline-none ml-2 text-sm w-48" />
            </div>
            <select className="input-field w-36 py-2 text-sm">
              <option>All Categories</option>
              <option>Antibiotics</option>
              <option>Analgesics</option>
              <option>Cardiovascular</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pharmacyItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.id}</p>
                  </td>
                  <td className="px-4 py-3"><span className="badge-info">{item.category}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{item.stock.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.batch}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.expiry}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100">Dispense</button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Forecasting */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🧠</span>
          <h3 className="text-lg font-semibold text-gray-800">AI Demand Forecasting</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700 font-medium">Suggested Purchase</p>
            <p className="text-lg font-bold text-green-800 mt-1">Atorvastatin 10mg</p>
            <p className="text-xs text-green-600 mt-1">Predicted demand: 500 units/month</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium">Expiry Alert</p>
            <p className="text-lg font-bold text-yellow-800 mt-1">Insulin Glargine</p>
            <p className="text-xs text-yellow-600 mt-1">45 units expiring in Oct 2026</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Seasonal Trend</p>
            <p className="text-lg font-bold text-blue-800 mt-1">Antihistamines ↑ 40%</p>
            <p className="text-xs text-blue-600 mt-1">Expected increase during monsoon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
