import React from 'react';

export default function StatCard({ title, value, icon, change, changeType, color = 'blue' }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600',
    pink: 'from-pink-500 to-pink-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {changeType === 'up' ? '↑' : '↓'} {change}
              </span>
              <span className="text-xs text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center shadow-sm`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
