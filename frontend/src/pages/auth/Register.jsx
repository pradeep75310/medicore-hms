import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'patient'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({
      user: { name: formData.name, email: formData.email, role: formData.role },
      role: formData.role,
      token: 'demo-token'
    }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-medicore-500 to-medicore-700 rounded-lg flex items-center justify-center">
            <HiOutlineShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-medicore-700">MediCore HMS</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500 mt-2">Register as a new patient</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className="input-field pl-10" placeholder="Enter your full name" required
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" className="input-field pl-10" placeholder="Email address" required
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="tel" className="input-field pl-10" placeholder="+91 XXXXX XXXXX" required
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select className="input-field" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="lab_tech">Lab Technician</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? 'text' : 'password'} className="input-field pl-10" placeholder="Password" required
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? 'text' : 'password'} className="input-field pl-10" placeholder="Confirm" required
                    value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input type="checkbox" className="w-4 h-4 mt-0.5 text-medicore-600 rounded border-gray-300" required />
              <span className="text-sm text-gray-600">I agree to the <a href="#" className="text-medicore-600">Terms of Service</a> and <a href="#" className="text-medicore-600">Privacy Policy</a></span>
            </label>

            <button type="submit" className="btn-primary w-full py-3">Create Account</button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-medicore-600 hover:text-medicore-700 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
