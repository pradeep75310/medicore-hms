import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      dispatch(login({
        user: { name: 'Admin User', email: formData.email, role: 'Super Admin' },
        role: 'super_admin',
        token: 'demo-token'
      }));
      navigate('/dashboard');
      setLoading(false);
    }, 1000);
  };

  // Roles exactly as listed in the MediCore Enterprise HMS PDF, section 3 (User Roles)
  const demoLogin = (role) => {
    const roles = {
      super_admin: { name: 'Super Admin', email: 'superadmin@medicore.com', role: 'Super Admin' },
      hospital_admin: { name: 'Dr. Hospital Admin', email: 'admin@medicore.com', role: 'Hospital Admin' },
      doctor: { name: 'Dr. Meera Joshi', email: 'doctor@medicore.com', role: 'Doctor' },
      receptionist: { name: 'Priya Desai', email: 'reception@medicore.com', role: 'Receptionist' },
      nurse: { name: 'Sunita Rane', email: 'nurse@medicore.com', role: 'Nurse' },
      lab_technician: { name: 'Rahul Bhosale', email: 'lab@medicore.com', role: 'Lab Technician' },
      pharmacist: { name: 'Anjali Kadam', email: 'pharmacy@medicore.com', role: 'Pharmacist' },
      accountant: { name: 'Vivek Shinde', email: 'accounts@medicore.com', role: 'Accountant' },
      patient: { name: 'Rajesh Kumar', email: 'patient@medicore.com', role: 'Patient' },
    };
    dispatch(login({ user: roles[role], role, token: 'demo-token' }));
    navigate('/dashboard');
  };

  const demoButtons = [
    { role: 'super_admin', label: 'Super Admin', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
    { role: 'hospital_admin', label: 'Hospital Admin', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    { role: 'doctor', label: 'Doctor', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { role: 'receptionist', label: 'Receptionist', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' },
    { role: 'nurse', label: 'Nurse', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
    { role: 'lab_technician', label: 'Lab Technician', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200' },
    { role: 'pharmacist', label: 'Pharmacist', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200' },
    { role: 'accountant', label: 'Accountant', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
    { role: 'patient', label: 'Patient', color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-medicore-600 via-medicore-700 to-medicore-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MediCore</h1>
              <p className="text-medicore-200 text-sm">Enterprise HMS</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Enterprise-Grade<br />
            Smart Hospital<br />
            Management System
          </h2>
          <p className="text-medicore-200 text-lg max-w-md">
            Integrated Clinical, Administrative, Financial, and Patient Care Services for modern healthcare organizations.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { num: '12,000+', label: 'Patients Managed' },
              { num: '150+', label: 'Doctors Onboard' },
              { num: '99.9%', label: 'Uptime SLA' },
              { num: '50+', label: 'Hospitals Trust Us' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{stat.num}</p>
                <p className="text-medicore-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-medicore-300 text-sm">
          © 2026 MediCore Enterprise HMS. HIPAA Compliant.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-medicore-500 to-medicore-700 rounded-lg flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-medicore-700">MediCore HMS</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to your MediCore account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    className="input-field pl-10"
                    placeholder="admin@medicore.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-medicore-600 rounded border-gray-300 focus:ring-medicore-500" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-medicore-600 hover:text-medicore-700 font-medium">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-center"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-400">Quick Demo Login — all 9 roles</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {demoButtons.map(demo => (
                  <button
                    key={demo.role}
                    onClick={() => demoLogin(demo.role)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border ${demo.color} transition-colors`}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <a href="/register" className="text-medicore-600 hover:text-medicore-700 font-medium">Contact Administrator</a>
          </p>
        </div>
      </div>
    </div>
  );
}