import React, { useState } from 'react';
import { FiFile, FiClock, FiUser, FiDownload, FiMic, FiCpu } from 'react-icons/fi';
import { recentPatients } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

const emrRecords = [
  { id: 1, patient: 'Rajesh Kumar', date: '2026-08-23', diagnosis: 'Hypertension Stage 2', doctor: 'Dr. Meera Joshi', prescription: 'Amlodipine 5mg, Telmisartan 40mg', notes: 'BP 150/95, advised lifestyle changes' },
  { id: 2, patient: 'Priya Sharma', date: '2026-08-23', diagnosis: 'Fractured Tibia', doctor: 'Dr. Anil Kulkarni', prescription: 'Pain medication, physiotherapy referral', notes: 'X-ray confirms hairline fracture, cast applied' },
  { id: 3, patient: 'Sneha Reddy', date: '2026-08-23', diagnosis: 'Atopic Dermatitis', doctor: 'Dr. Pooja Nair', prescription: 'Hydrocortisone cream, antihistamines', notes: 'Chronic eczema, follow-up in 2 weeks' },
  { id: 4, patient: 'Amit Patel', date: '2026-08-22', diagnosis: 'Cerebral Ischemia', doctor: 'Dr. Neha Agarwal', prescription: 'Aspirin 75mg, Atorvastatin 10mg', notes: 'MRI shows mild ischemic changes' },
];

export default function EMR() {
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div>
      <PageHeader 
        title="Electronic Medical Records (EMR)" 
        subtitle="Access and manage patient medical histories, diagnoses, and prescriptions"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2"><FiMic size={16} /> Voice Notes</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiCpu size={16} /> AI Summary</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Patients</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {recentPatients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPatient?.id === p.id ? 'bg-medicore-50 border border-medicore-200' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medicore-100 rounded-full flex items-center justify-center">
                    <span className="text-medicore-700 text-sm font-medium">{p.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.id} • {p.age} yrs</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* EMR Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPatient ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-medicore-100 rounded-full flex items-center justify-center">
                      <span className="text-medicore-700 font-semibold">{selectedPatient.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedPatient.name}</h3>
                      <p className="text-sm text-gray-500">{selectedPatient.id} • {selectedPatient.age} yrs • {selectedPatient.gender} • Blood: B+</p>
                    </div>
                  </div>
                  <button className="btn-secondary text-sm flex items-center gap-2"><FiDownload size={16} /> Export</button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Allergies</p>
                    <p className="text-sm font-medium text-red-600">Penicillin, Dust</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Chronic Conditions</p>
                    <p className="text-sm font-medium text-gray-700">Diabetes Type 2</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Last Visit</p>
                    <p className="text-sm font-medium text-gray-700">Aug 20, 2026</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-4">Medical Timeline</h4>
                <div className="space-y-4">
                  {emrRecords.map((record, idx) => (
                    <div key={record.id} className="relative pl-6 border-l-2 border-medicore-200 pb-4">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 bg-medicore-600 rounded-full"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-medicore-600">{record.date}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{record.doctor}</span>
                      </div>
                      <h5 className="text-sm font-semibold text-gray-800">{record.diagnosis}</h5>
                      <p className="text-sm text-gray-600 mt-1"><strong>Rx:</strong> {record.prescription}</p>
                      <p className="text-sm text-gray-500 mt-1 italic">"{record.notes}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-4">Vaccination Records</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-4 py-2">Vaccine</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Batch</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="px-4 py-2 text-sm">COVID-19 Booster</td><td className="px-4 py-2 text-sm text-gray-500">2026-03-15</td><td className="px-4 py-2 text-sm text-gray-500">COV-2026-123</td><td className="px-4 py-2"><span className="badge-success">Completed</span></td></tr>
                      <tr><td className="px-4 py-2 text-sm">Influenza</td><td className="px-4 py-2 text-sm text-gray-500">2025-11-20</td><td className="px-4 py-2 text-sm text-gray-500">FLU-2025-456</td><td className="px-4 py-2"><span className="badge-success">Completed</span></td></tr>
                      <tr><td className="px-4 py-2 text-sm">Hepatitis B</td><td className="px-4 py-2 text-sm text-gray-500">2025-06-10</td><td className="px-4 py-2 text-sm text-gray-500">HEP-2025-789</td><td className="px-4 py-2"><span className="badge-success">Completed</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card flex items-center justify-center h-96">
              <div className="text-center">
                <FiFile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">Select a Patient</h3>
                <p className="text-sm text-gray-400 mt-1">Choose a patient from the list to view their medical records</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
