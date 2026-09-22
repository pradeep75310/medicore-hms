import React, { useState } from 'react';
import { FiCpu, FiActivity, FiHeart, FiMessageSquare, FiTrendingUp, FiImage, FiDroplet } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

const aiFeatures = [
  { 
    icon: <FiHeart />, title: 'AI Symptom Checker', 
    description: 'Disease prediction and risk assessment based on patient symptoms using machine learning models.',
    status: 'Active', color: 'from-red-500 to-pink-500', usage: '1,234 checks today'
  },
  { 
    icon: <FiCpu />, title: 'AI Medical Assistant', 
    description: 'Doctor support with clinical suggestions, drug interactions, and treatment recommendations.',
    status: 'Active', color: 'from-blue-500 to-cyan-500', usage: '856 consultations'
  },
  { 
    icon: <FiImage />, title: 'AI Report Analysis', 
    description: 'X-Ray analysis, blood report interpretation, and automated abnormality detection.',
    status: 'Active', color: 'from-purple-500 to-indigo-500', usage: '445 scans analyzed'
  },
  { 
    icon: <FiMessageSquare />, title: 'AI Chatbot', 
    description: 'Patient queries, appointment booking assistance, and 24/7 healthcare guidance.',
    status: 'Active', color: 'from-green-500 to-emerald-500', usage: '3,450 conversations'
  },
  { 
    icon: <FiTrendingUp />, title: 'Predictive Analytics', 
    description: 'Readmission prediction, disease outbreak prediction, and resource allocation optimization.',
    status: 'Active', color: 'from-orange-500 to-amber-500', usage: '92% accuracy'
  },
  { 
    icon: <FiDroplet />, title: 'AI Lab Interpretation', 
    description: 'Automated report interpretation with risk detection and doctor-friendly summaries.',
    status: 'Beta', color: 'from-teal-500 to-cyan-500', usage: '278 reports today'
  },
];

export default function AIFeatures() {
  const [symptomInput, setSymptomInput] = useState('');
  const [showResults, setShowResults] = useState(false);

  return (
    <div>
      <PageHeader 
        title="AI-Powered Healthcare" 
        subtitle="Enterprise AI features for intelligent healthcare delivery"
        action={
          <span className="badge bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm">
            🚀 Enterprise Edition
          </span>
        }
      />

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {aiFeatures.map((feature, idx) => (
          <div key={idx} className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
              {React.cloneElement(feature.icon, { size: 22 })}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-800">{feature.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                feature.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{feature.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{feature.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-medicore-600 font-medium">{feature.usage}</span>
              <button className="text-sm text-medicore-600 hover:text-medicore-700 font-medium">Open →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive AI Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Checker */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiHeart className="text-red-500" /> AI Symptom Checker
          </h3>
          <div className="space-y-3">
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe symptoms... e.g., 'Persistent headache, mild fever for 3 days, body ache'"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
            />
            <button 
              onClick={() => setShowResults(true)}
              className="btn-primary w-full"
            >
              Analyze Symptoms
            </button>
            {showResults && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-3">
                <p className="text-sm font-medium text-blue-800 mb-2">🤖 AI Analysis Results:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Viral Infection (Probable)</span>
                    <span className="text-sm font-medium text-blue-800">72%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Seasonal Flu</span>
                    <span className="text-sm font-medium text-blue-800">58%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2 italic">⚠️ This is AI-suggested. Please consult a doctor for confirmation.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chatbot Preview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiMessageSquare className="text-green-500" /> AI Healthcare Chatbot
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto space-y-3">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-medicore-100 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-sm text-gray-700 max-w-[80%] shadow-sm">
                Hello! I'm MediCore AI Assistant. How can I help you today? I can help with appointment booking, health queries, and medical information.
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="bg-medicore-600 text-white rounded-lg p-3 text-sm max-w-[80%]">
                I want to book an appointment with a cardiologist for next week.
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-medicore-100 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-sm text-gray-700 max-w-[80%] shadow-sm">
                I found these available cardiologists next week:<br/>
                <strong>Dr. Meera Joshi</strong> - Mon, 10:00 AM<br/>
                <strong>Dr. Rajesh Sharma</strong> - Wed, 2:30 PM<br/>
                Would you like to book either of these?
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <input className="input-field flex-1" placeholder="Type your message..." />
            <button className="btn-primary">Send</button>
          </div>
        </div>
      </div>

      {/* AI Metrics */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'AI Accuracy', value: '94.7%', color: 'text-green-600' },
            { label: 'Predictions Today', value: '2,847', color: 'text-blue-600' },
            { label: 'Lives Impacted', value: '12,450', color: 'text-purple-600' },
            { label: 'Models Active', value: '8', color: 'text-orange-600' },
          ].map(m => (
            <div key={m.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-sm text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
