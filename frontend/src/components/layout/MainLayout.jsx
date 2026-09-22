import React from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }) {
  const { sidebarOpen } = useSelector(state => state.ui);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className={`
        pt-16 min-h-screen transition-all duration-300
        ${sidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
