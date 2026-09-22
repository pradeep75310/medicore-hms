import React, { useState } from 'react';
import { FiVideo, FiMessageSquare, FiPhone, FiCalendar, FiClock, FiFileText, FiGlobe } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

const consultations = [
  { id: 'TC-301', patient: 'Rajesh Kumar', doctor: 'Dr. Meera Joshi', time: '09:00 AM', type: 'Video', status: 'Live', duration: '15 min' },
  { id: 'TC-302', patient: 'Mohammed Ali', doctor: 'Dr. Sanjay Gupta', time: '10:00 AM', type: 'Video', status: 'Scheduled', duration: '-' },
  { id: 'TC-303', patient: 'Kavita Deshmukh', doctor: 'Dr. Pooja Nair', time: '11:30 AM', type: 'Chat', status: 'Scheduled', duration: '-' },
  { id: 'TC-304', patient: 'Ananya Iyer', doctor: 'Dr. Sunita Rao', time: '02:00 PM', type: 'Video', status: 'Scheduled', duration: '-' },
  { id: 'TC-305', patient: 'Deepak Verma', doctor: 'Dr. Neha Agarwal', time: '03:30 PM', type: 'Video', status: 'Completed', duration: '22 min' },
];

export default function Telemedicine() {
  const [activeCall, setActiveCall] = useState(false);

  return (
    <div>
      <PageHeader 
        title="Telemedicine" 
        subtitle="Video and chat consultations with integrated AI assistance"
        action={
          <button className="btn-primary text-sm flex items-center gap-2">
            <FiCalendar size={16} /> Schedule Consultation
          </button>
        }
      />

      {activeCall && (
        <div className="card mb-6 bg-gradient-to-r from-medicore-600 to-medicore-800 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <FiVideo size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Live Consultation</h3>
                <p className="text-medicore-200">Rajesh Kumar • Dr. Meera Joshi • 15:32 elapsed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="p-3 bg-white/20 rounded-lg hover:bg-white/30"><FiMic size={20} /></button>
              <button className="p-3 bg-white/20 rounded-lg hover:bg-white/30"><FiGlobe size={20} /></button>
              <button onClick={() => setActiveCall(false)} className="p-3 bg-red-500 rounded-lg hover:bg-red-600"><FiPhone size={20} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Today\'s Consultations', value: '12', icon: <FiVideo />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Now', value: '2', icon: <FiPhone />, color: 'text-green-600 bg-green-50' },
          { label: 'Completed Today', value: '8', icon: <FiFileText />, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Consultations</h3>
        <div className="space-y-3">
          {consultations.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.type === 'Video' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {c.type === 'Video' ? <FiVideo size={18} /> : <FiMessageSquare size={18} />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{c.patient}</p>
                  <p className="text-sm text-gray-500">{c.doctor} • {c.type} Call</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1"><FiClock size={14} /> {c.time}</p>
                  {c.duration !== '-' && <p className="text-xs text-gray-400">{c.duration}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  c.status === 'Live' ? 'bg-red-100 text-red-700 animate-pulse' :
                  c.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-green-100 text-green-700'
                }`}>{c.status}</span>
                {c.status === 'Scheduled' && (
                  <button onClick={() => setActiveCall(true)} className="btn-primary text-xs py-1.5 px-3">Join</button>
                )}
                {c.status === 'Live' && (
                  <button className="btn-danger text-xs py-1.5 px-3">Resume</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
