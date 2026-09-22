import React from 'react';
import { FiAlertTriangle, FiPhone, FiTruck, FiPlus, FiClock } from 'react-icons/fi';
import { emergencyCases } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Emergency() {
  return (
    <div>
      <PageHeader 
        title="Emergency Management" 
        subtitle="Emergency registration, trauma tracking, and ambulance integration"
        action={
          <div className="flex gap-3">
            <button className="btn-danger text-sm flex items-center gap-2 animate-pulse"><FiAlertTriangle size={16} /> Emergency Alert</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> Register Case</button>
          </div>
        }
      />

      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Cases', value: '4', color: 'bg-red-500', icon: <FiAlertTriangle /> },
          { label: 'Ambulances Active', value: '3', color: 'bg-blue-500', icon: <FiTruck /> },
          { label: 'Avg Response Time', value: '4.2 min', color: 'bg-green-500', icon: <FiClock /> },
          { label: 'Resolved Today', value: '12', color: 'bg-gray-500', icon: <FiPhone /> },
        ].map(stat => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Emergency Cases */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Active Emergency Cases
        </h3>
        <div className="space-y-3">
          {emergencyCases.map(c => (
            <div key={c.id} className={`p-4 rounded-lg border-l-4 ${
              c.priority === 'Critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    c.priority === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    <FiAlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">{c.patient}</h4>
                      <span className="text-xs text-gray-500">{c.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.priority === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>{c.priority}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.condition}</p>
                    <p className="text-xs text-gray-500 mt-1">Age: {c.age} • Time: {c.time} • Doctor: {c.doctor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    c.status === 'In Treatment' ? 'bg-red-100 text-red-700' :
                    c.status === 'Stabilized' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{c.status}</span>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 text-xs bg-white border rounded-lg hover:bg-gray-50">Update</button>
                    <button className="px-3 py-1 text-xs bg-white border rounded-lg hover:bg-gray-50">Transfer</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ambulance Tracking */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚑 Ambulance Fleet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'AMB-01', driver: 'Arun Shinde', status: 'On Route', patient: 'Emergency pickup - Hadapsar', eta: '8 min' },
            { id: 'AMB-02', driver: 'Suresh Pawar', status: 'Available', patient: '-', eta: '-' },
            { id: 'AMB-03', driver: 'Kiran More', status: 'Returning', patient: 'Delivered to Hospital', eta: '12 min' },
          ].map(amb => (
            <div key={amb.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{amb.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  amb.status === 'On Route' ? 'bg-red-100 text-red-700' :
                  amb.status === 'Available' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{amb.status}</span>
              </div>
              <p className="text-sm text-gray-600">Driver: {amb.driver}</p>
              <p className="text-sm text-gray-500">{amb.patient}</p>
              {amb.eta !== '-' && <p className="text-xs text-medicore-600 font-medium mt-1">ETA: {amb.eta}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
