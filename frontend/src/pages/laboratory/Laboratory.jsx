import React, { useState } from 'react';
import { FiSearch, FiPlus, FiDownload, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { labTests } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Laboratory() {
  return (
    <div>
      <PageHeader 
        title="Laboratory Management" 
        subtitle="Manage test orders, samples, and report generation"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2"><FiDownload size={16} /> Export Reports</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> New Test Order</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tests Today', value: '89', color: 'bg-blue-500' },
          { label: 'Pending', value: '23', color: 'bg-yellow-500' },
          { label: 'In Progress', value: '12', color: 'bg-purple-500' },
          { label: 'Completed', value: '54', color: 'bg-green-500' },
        ].map(stat => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`w-2 h-12 rounded-full ${stat.color}`}></div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Lab Test Orders</h3>
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" size={16} />
            <input type="text" placeholder="Search tests..." className="bg-transparent border-none outline-none ml-2 text-sm w-40" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Test ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Test Name</th>
                <th className="px-4 py-3">Ordered By</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labTests.map(test => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-medicore-600">{test.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{test.patient}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.test}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.doctor}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${test.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {test.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                      test.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      test.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {test.status === 'Completed' ? <FiCheckCircle size={12} /> : test.status === 'In Progress' ? <FiClock size={12} /> : <FiAlertTriangle size={12} />}
                      {test.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{test.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100">View</button>
                      {test.status === 'Completed' && (
                        <button className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Report</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-gray-800">AI Report Interpretation</h3>
          <span className="badge-info ml-2">Enterprise Feature</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-medicore-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Blood Report Analysis</h4>
            <p className="text-sm text-gray-600">AI-powered interpretation of CBC, lipid panel, and metabolic tests with risk scoring.</p>
            <button className="mt-3 text-sm text-medicore-600 font-medium">Run Analysis →</button>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">X-Ray AI Detection</h4>
            <p className="text-sm text-gray-600">Automated detection of fractures, tumors, and abnormalities in radiological images.</p>
            <button className="mt-3 text-sm text-medicore-600 font-medium">Upload Image →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
