import React, { useState } from 'react';
import { FiSearch, FiStar, FiUsers, FiClock, FiAward } from 'react-icons/fi';
import { doctors } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Doctors() {
  const [view, setView] = useState('grid');

  return (
    <div>
      <PageHeader 
        title="Doctors Directory" 
        subtitle="Manage doctors, schedules and specializations"
        action={
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>Grid</button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>List</button>
            </div>
            <button className="btn-primary text-sm">+ Add Doctor</button>
          </div>
        }
      />

      {/* Search */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-[250px]">
            <FiSearch className="text-gray-400" size={16} />
            <input type="text" placeholder="Search doctors by name or specialization..." className="bg-transparent border-none outline-none ml-2 w-full text-sm" />
          </div>
          <select className="input-field w-40 py-2 text-sm">
            <option>All Departments</option>
            <option>Cardiology</option>
            <option>Orthopedics</option>
            <option>Neurology</option>
          </select>
          <select className="input-field w-36 py-2 text-sm">
            <option>All Status</option>
            <option>Available</option>
            <option>In Surgery</option>
            <option>On Leave</option>
          </select>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-medicore-400 to-medicore-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{doc.name.split(' ').slice(1).map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{doc.name}</h4>
                    <p className="text-xs text-gray-500">{doc.specialization}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  doc.status === 'Available' ? 'bg-green-100 text-green-700' :
                  doc.status === 'In Surgery' ? 'bg-red-100 text-red-700' :
                  doc.status === 'In Consultation' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{doc.status}</span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiAward size={14} className="text-medicore-500" /> {doc.department}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock size={14} className="text-medicore-500" /> {doc.experience} years experience
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUsers size={14} className="text-medicore-500" /> {doc.patients} patients
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <FiStar size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-gray-700 font-medium">{doc.rating}</span>
                  <span className="text-gray-400 text-xs">/ 5.0</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 text-sm py-2 bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100 font-medium">View Profile</button>
                <button className="flex-1 text-sm py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Schedule</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Patients</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-medicore-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-medicore-700">{doc.name.split(' ')[1]?.[0]}{doc.name.split(' ')[2]?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-info">{doc.department}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.specialization}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.experience} years</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.patients}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <FiStar size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{doc.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === 'Available' ? 'bg-green-100 text-green-700' :
                      doc.status === 'In Surgery' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{doc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
