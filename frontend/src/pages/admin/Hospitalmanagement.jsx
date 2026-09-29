import React, { useState } from 'react';
import { FiPlus, FiX, FiBuilding } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

// Mock data — real API integration (POST /api/hospitals/hospitals/) comes after backend Step 1-4 per the contract
const initialHospitals = [
  { id: 1, name: 'MediCore Central', code: 'MC-001', type: 'Private', city: 'Pune', branches: 3, status: 'Active' },
  { id: 2, name: 'MediCore North', code: 'MC-002', type: 'Government', city: 'Nashik', branches: 1, status: 'Active' },
  { id: 3, name: 'MediCore Coastal', code: 'MC-003', type: 'Private', city: 'Ratnagiri', branches: 2, status: 'Inactive' },
];

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', hospitalCode: '', hospitalType: 'Private', phone: '', email: '', city: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    // Frontend form keys (camelCase) — mapped to backend snake_case when API integration happens:
    // name -> name, hospitalCode -> hospital_code, hospitalType -> hospital_type, phone -> phone, email -> email
    setHospitals(prev => [
      ...prev,
      { id: prev.length + 1, name: form.name, code: form.hospitalCode, type: form.hospitalType, city: form.city, branches: 0, status: 'Active' },
    ]);
    setForm({ name: '', hospitalCode: '', hospitalType: 'Private', phone: '', email: '', city: '' });
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Hospital Management"
        subtitle="Super Admin — create and oversee all hospitals on the platform"
        action={
          <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
            <span className="flex items-center gap-2"><FiPlus size={16} /> Add Hospital</span>
          </button>
        }
      />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hospitals.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-medicore-100 rounded-lg flex items-center justify-center">
                        <FiBuilding className="text-medicore-700" size={15} />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-medicore-600 font-medium">{h.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{h.branches}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {h.status}
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
              <h3 className="text-lg font-semibold text-gray-800">Add Hospital</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name</label>
                <input required className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. MediCore West" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Code</label>
                <input required className="input-field" value={form.hospitalCode} onChange={e => setForm({ ...form, hospitalCode: e.target.value })} placeholder="e.g. MC-004" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select className="input-field" value={form.hospitalType} onChange={e => setForm({ ...form, hospitalType: e.target.value })}>
                  <option>Private</option>
                  <option>Government</option>
                  <option>Trust</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input className="input-field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Pune" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@hospital.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 90000 00000" />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Create Hospital</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}