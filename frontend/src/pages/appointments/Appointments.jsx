import React, { useState } from 'react';
import { FiSearch, FiPlus, FiCalendar, FiClock, FiFilter } from 'react-icons/fi';
import { appointments } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Appointments() {
  const [view, setView] = useState('list');
  const [filter, setFilter] = useState('all');

  return (
    <div>
      <PageHeader 
        title="Appointment Management" 
        subtitle="Schedule, track and manage all appointments"
        action={
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>List</button>
              <button onClick={() => setView('calendar')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'calendar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>Calendar</button>
            </div>
            <button className="btn-primary text-sm flex items-center gap-2">
              <FiPlus size={16} /> New Appointment
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All', count: appointments.length },
          { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'Confirmed').length },
          { key: 'waiting', label: 'Waiting', count: appointments.filter(a => a.status === 'Waiting').length },
          { key: 'in-progress', label: 'In Progress', count: appointments.filter(a => a.status === 'In Progress').length },
          { key: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'Scheduled').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              filter === tab.key ? 'bg-medicore-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label} <span className={`ml-1 text-xs ${filter === tab.key ? 'text-medicore-200' : 'text-gray-400'}`}>({tab.count})</span>
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Appointment ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-medicore-600">{apt.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-medicore-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-medicore-700">{apt.patient.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{apt.patient}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.doctor}</td>
                    <td className="px-4 py-3"><span className="badge-info">{apt.department}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FiClock size={14} /> {apt.time}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' :
                        apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{apt.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100">View</button>
                        <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Reschedule</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">August 2026</h3>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">← Prev</button>
              <button className="btn-secondary text-sm">Today</button>
              <button className="btn-secondary text-sm">Next →</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 5 + 1;
              const isToday = day === 23;
              const hasApts = day > 0 && day <= 31 && Math.random() > 0.5;
              return (
                <div key={i} className={`bg-white p-2 min-h-[80px] ${day <= 0 || day > 31 ? 'bg-gray-50' : ''}`}>
                  {day > 0 && day <= 31 && (
                    <>
                      <span className={`text-sm ${isToday ? 'bg-medicore-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                        {day}
                      </span>
                      {hasApts && (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-[10px] bg-medicore-100 text-medicore-700 rounded px-1 truncate">Dr. Joshi - 3</div>
                          <div className="text-[10px] bg-green-100 text-green-700 rounded px-1 truncate">OPD - 5</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
