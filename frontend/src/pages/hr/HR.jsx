import React from 'react';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign, FiPlus } from 'react-icons/fi';
import { employees } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function HR() {
  return (
    <div>
      <PageHeader 
        title="HR & Staff Management" 
        subtitle="Employee records, attendance tracking, and payroll management"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm">Generate Payroll</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> Add Employee</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Staff', value: '284', icon: <FiUsers />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Present Today', value: '256', icon: <FiUserCheck />, color: 'bg-green-50 text-green-600' },
          { label: 'On Leave', value: '18', icon: <FiUserX />, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Monthly Payroll', value: '₹42.5L', icon: <FiDollarSign />, color: 'bg-purple-50 text-purple-600' },
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Directory</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Join Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-medicore-400 to-medicore-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.role}</td>
                  <td className="px-4 py-3"><span className="badge-info">{emp.department}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{emp.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: emp.attendance }}></div>
                      </div>
                      <span className="text-xs text-gray-600">{emp.attendance}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{emp.joinDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg">Profile</button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg">Pay Slip</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Face Recognition Attendance */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📸</span>
          <h3 className="text-lg font-semibold text-gray-800">Face Recognition Attendance</h3>
          <span className="badge-info ml-2">Enterprise</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
            <p className="text-3xl font-bold text-green-700">248</p>
            <p className="text-sm text-green-600 mt-1">Checked In Today</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
            <p className="text-3xl font-bold text-red-700">18</p>
            <p className="text-sm text-red-600 mt-1">Not Checked In</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
            <p className="text-3xl font-bold text-blue-700">18</p>
            <p className="text-sm text-blue-600 mt-1">On Leave</p>
          </div>
        </div>
      </div>
    </div>
  );
}
