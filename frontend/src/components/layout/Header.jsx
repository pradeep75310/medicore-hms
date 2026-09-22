import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/uiSlice';
import { logout } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  FiMenu, FiBell, FiSearch, FiChevronDown, FiLogOut,
  FiUser, FiSettings, FiMessageSquare
} from 'react-icons/fi';

export default function Header() {
  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, text: 'New patient registered: Ananya Iyer', time: '5 min ago', type: 'info' },
    { id: 2, text: 'Emergency case admitted - EM-701', time: '15 min ago', type: 'danger' },
    { id: 3, text: 'Lab report ready for P-10234', time: '30 min ago', type: 'success' },
    { id: 4, text: 'Low stock alert: Atorvastatin 10mg', time: '1 hr ago', type: 'warning' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={`
      fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30
      transition-all duration-300
      ${sidebarOpen ? 'left-64' : 'left-0 lg:left-20'}
    `}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiMenu size={20} />
          </button>
          
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-80">
            <FiSearch className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search patients, doctors, appointments..."
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-600 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <p className="text-sm text-gray-700">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-sm text-medicore-600 hover:text-medicore-700 font-medium">View All</button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FiMessageSquare size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-medicore-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-medicore-400 to-medicore-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Super Admin'}</p>
              </div>
              <FiChevronDown size={14} className="text-gray-400" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <FiUser size={16} /> My Profile
                </a>
                <a href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <FiSettings size={16} /> Settings
                </a>
                <hr className="my-1 border-gray-100" />
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
