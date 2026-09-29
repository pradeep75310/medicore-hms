import React, { useState } from 'react';
import { FiPlus, FiX, FiMapPin } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

// Mock data — real API integration (POST /api/branches/) comes after Tarim's Branch model lands on main
const initialBranches = [
  { id: 1, name: 'Main Campus', code: 'MC-001-A', hospital: 'MediCore Central', city: 'Pune', departments: 6, status: 'Active' },
  { id: 2, name: 'East Wing', code: 'MC-001-B', hospital: 'MediCore Central', city: 'Pune', departments: 4, status: 'Active' },
  { id: 3, name: 'Nashik Branch', code: 'MC-002-A', hospital: 'MediCore North', city: 'Nashik', departments: 5, status: 'Active' },
];

export default function BranchManagement() {
  const [branches, setBranches] = useState(initialBranches);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ hospital: 'MediCore Central', name: '', branchCode: '', city: '', phone: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    // Frontend form keys (camelCase) — mapped to backend snake_case: branchCode -> branch_code, hospital -> hospital (id)
    setBranches(prev => [
      ...prev,
      { id: prev.length + 1, name: form.name, code: form.branchCode, hospital: form.hospital, city: form.city, departments: 0, status: 'Active' },
    ]);
    setForm({ hospital: 'MediCore Central', name: '', branchCode: '', city: '', phone: '' });
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Branch Management"
        subtitle="Super Admin / Hospital Admin — manage branches under each hospital"
        action={
          <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
            <span className="flex items-center gap-2"><FiPlus size={16} /> Add Branch</span>
          </button>
        }
      />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Departments</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-medicore-100 rounded-lg flex items-center justify-center">
                        <FiMapPin className="text-medicore-700" size={15} />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-medicore-600 font-medium">{b.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.hospital}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.departments}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Add Branch</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital</label>
                <select className="input-field" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })}>
                  <option>MediCore Central</option>
                  <option>MediCore North</option>
                  <option>MediCore Coastal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Name</label>
                <input required className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. West Wing" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Code</label>
                <input required className="input-field" value={form.branchCode} onChange={e => setForm({ ...form, branchCode: e.target.value })} placeholder="e.g. MC-001-C" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input className="input-field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Pune" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 90000 00000" />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Create Branch</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}