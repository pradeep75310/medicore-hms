import React from 'react';
import { FiPlus, FiLayers } from 'react-icons/fi';
import { bedOccupancy } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

const ipdPatients = [
  { id: 'IPD-201', name: 'Vikram Singh', ward: 'ICU', bed: 'ICU-05', doctor: 'Dr. Vikash Malhotra', admission: '2026-08-20', condition: 'Critical', discharge: '-' },
  { id: 'IPD-202', name: 'Lakshmi Devi', ward: 'ICU', bed: 'ICU-08', doctor: 'Dr. Meera Joshi', admission: '2026-08-22', condition: 'Stable', discharge: '-' },
  { id: 'IPD-203', name: 'Ramesh Gupta', ward: 'General', bed: 'GW-12', doctor: 'Dr. Anil Kulkarni', admission: '2026-08-18', condition: 'Recovering', discharge: '2026-08-24' },
  { id: 'IPD-204', name: 'Sunita Bai', ward: 'Semi-Private', bed: 'SP-07', doctor: 'Dr. Sunita Rao', admission: '2026-08-21', condition: 'Stable', discharge: '2026-08-25' },
  { id: 'IPD-205', name: 'Arjun Reddy', ward: 'Private', bed: 'PR-03', doctor: 'Dr. Neha Agarwal', admission: '2026-08-19', condition: 'Recovering', discharge: '2026-08-23' },
];

export default function IPD() {
  return (
    <div>
      <PageHeader 
        title="Inpatient (IPD) Management" 
        subtitle="Bed allocation, ward management, and discharge tracking"
        action={<button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> Admit Patient</button>}
      />

      {/* Bed Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {bedOccupancy.map(ward => (
          <div key={ward.ward} className="card text-center">
            <p className="text-xs text-gray-500 font-medium">{ward.ward}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{ward.occupied}<span className="text-sm text-gray-400">/{ward.total}</span></p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-medicore-500 h-2 rounded-full" style={{ width: `${(ward.occupied / ward.total) * 100}%` }}></div>
            </div>
            <p className="text-xs text-green-600 mt-1">{ward.available} available</p>
          </div>
        ))}
      </div>

      {/* Visual Bed Map */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bed Map - ICU Ward</h3>
        <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
          {Array.from({ length: 15 }, (_, i) => {
            const occupied = i < 12;
            return (
              <div key={i} className={`p-3 rounded-lg text-center text-xs font-medium border ${occupied ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                <FiLayers className="mx-auto mb-1" size={16} />
                ICU-{String(i + 1).padStart(2, '0')}
                <p className="text-[10px] mt-0.5">{occupied ? 'Occupied' : 'Available'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* IPD Patients */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Inpatients</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">IPD ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Ward / Bed</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Admitted</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Expected Discharge</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ipdPatients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-medicore-600">{p.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.ward} • {p.bed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.doctor}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.admission}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.condition === 'Critical' ? 'bg-red-100 text-red-700' :
                      p.condition === 'Recovering' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.condition}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.discharge}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg">Notes</button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg">Discharge</button>
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
