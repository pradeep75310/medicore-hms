import React, { useState } from 'react';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiHeart, FiAlertTriangle, FiUsers, FiSave } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

export default function PatientRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '', bloodGroup: '',
    allergies: '', medicalHistory: '', emergencyContact: '', emergencyPhone: '',
    insuranceProvider: '', insuranceNumber: '', department: '', doctor: ''
  });

  const updateField = (field, value) => setFormData({ ...formData, [field]: value });

  return (
    <div>
      <PageHeader title="Register New Patient" subtitle="Fill in the patient details to create a new record" />

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['Personal Info', 'Medical Info', 'Emergency & Insurance', 'Department'].map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${step > idx + 1 ? 'text-medicore-600' : step === idx + 1 ? 'text-medicore-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > idx + 1 ? 'bg-medicore-600 text-white' : step === idx + 1 ? 'bg-medicore-100 text-medicore-700 ring-2 ring-medicore-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              <span className="text-sm font-medium hidden md:block">{label}</span>
            </div>
            {idx < 3 && <div className={`w-16 h-0.5 mx-2 ${step > idx + 1 ? 'bg-medicore-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card max-w-4xl mx-auto">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiUser /> Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input className="input-field" placeholder="Enter first name" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input className="input-field" placeholder="Enter last name" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input type="date" className="input-field" value={formData.dob} onChange={e => updateField('dob', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select className="input-field" value={formData.gender} onChange={e => updateField('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input className="input-field" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" placeholder="patient@email.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea className="input-field" rows={2} placeholder="Full address" value={formData.address} onChange={e => updateField('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input className="input-field" placeholder="City" value={formData.city} onChange={e => updateField('city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input className="input-field" placeholder="State" value={formData.state} onChange={e => updateField('state', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiHeart /> Medical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select className="input-field" value={formData.bloodGroup} onChange={e => updateField('bloodGroup', e.target.value)}>
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
                <input className="input-field" placeholder="e.g., Penicillin, Dust" value={formData.allergies} onChange={e => updateField('allergies', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                <textarea className="input-field" rows={4} placeholder="Previous medical conditions, surgeries, etc." value={formData.medicalHistory} onChange={e => updateField('medicalHistory', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiAlertTriangle /> Emergency Contact & Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                <input className="input-field" placeholder="Contact person name" value={formData.emergencyContact} onChange={e => updateField('emergencyContact', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                <input className="input-field" placeholder="+91 XXXXX XXXXX" value={formData.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                <input className="input-field" placeholder="e.g., Star Health" value={formData.insuranceProvider} onChange={e => updateField('insuranceProvider', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                <input className="input-field" placeholder="Policy number" value={formData.insuranceNumber} onChange={e => updateField('insuranceNumber', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiUsers /> Department Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select className="input-field" value={formData.department} onChange={e => updateField('department', e.target.value)}>
                  <option value="">Select Department</option>
                  {['Cardiology', 'Orthopedics', 'Neurology', 'Dermatology', 'Gynecology', 'Pulmonology', 'Oncology', 'ENT', 'General Medicine'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor</label>
                <select className="input-field" value={formData.doctor} onChange={e => updateField('doctor', e.target.value)}>
                  <option value="">Select Doctor</option>
                  <option>Dr. Meera Joshi</option><option>Dr. Anil Kulkarni</option><option>Dr. Pooja Nair</option>
                </select>
              </div>
            </div>
            <div className="bg-medicore-50 rounded-lg p-4">
              <h4 className="font-medium text-medicore-700 mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600"><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p className="text-gray-600"><strong>Phone:</strong> {formData.phone}</p>
                <p className="text-gray-600"><strong>Gender:</strong> {formData.gender}</p>
                <p className="text-gray-600"><strong>Blood Group:</strong> {formData.bloodGroup || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => setStep(Math.max(1, step - 1))} className="btn-secondary" disabled={step === 1}>
            Previous
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary">
              Next Step
            </button>
          ) : (
            <button className="btn-success flex items-center gap-2">
              <FiSave size={16} /> Register Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
