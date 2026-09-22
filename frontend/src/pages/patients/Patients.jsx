import React, { useState } from 'react';
import { FiSearch, FiFilter, FiPlus, FiDownload, FiMoreVertical, FiEye, FiEdit, FiTrash2, FiPhone, FiMail } from 'react-icons/fi';
import { recentPatients } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPatients = recentPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <PageHeader 
        title="Patient Management" 
        subtitle="Manage all patient records, registrations, and medical histories"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2">
              <FiDownload size={16} /> Export
            </button>
            <a href="/patients/register" className="btn-primary text-sm flex items-center gap-2">
              <FiPlus size={16} /> Register Patient
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Patients', value: '12,847', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active Today', value: '256', color: 'bg-green-50 text-green-700' },
          { label: 'New This Month', value: '342', color: 'bg-purple-50 text-purple-700' },
          { label: 'Critical Cases', value: '8', color: 'bg-red-50 text-red-700' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-[250px]">
            <FiSearch className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or Patient ID..."
              className="bg-transparent border-none outline-none ml-2 w-full text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="input-field w-40 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
            <option value="critical">Critical</option>
            <option value="follow-up">Follow-up</option>
          </select>
          <button className="btn-secondary text-sm flex items-center gap-2">
            <FiFilter size={16} /> More Filters
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">UHID</th>
                <th className="px-4 py-3">Age/Gender</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-medicore-100 to-medicore-200 rounded-full flex items-center justify-center">
                        <span className="text-medicore-700 text-sm font-semibold">{p.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><FiMail size={10} /> {p.name.toLowerCase().replace(' ', '.')}@email.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-medicore-600">{p.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.age} yrs, {p.gender}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3">
                    <span className="badge-info">{p.department}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.status === 'Active' ? 'bg-green-100 text-green-700' :
                      p.status === 'Discharged' ? 'bg-gray-100 text-gray-700' :
                      p.status === 'Critical' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-medicore-600 hover:bg-medicore-50 rounded-lg transition-colors" title="View">
                        <FiEye size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <FiEdit size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Showing 1-8 of 12,847 patients</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1.5 text-sm bg-medicore-600 text-white rounded-lg">1</button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">3</button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
