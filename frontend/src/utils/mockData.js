// Mock data for MediCore HMS

export const statsData = {
  totalPatients: 12847,
  todayAppointments: 156,
  bedOccupancy: 78,
  dailyRevenue: 245000,
  doctorsAvailable: 42,
  emergencyCases: 8,
  labTestsToday: 89,
  pharmacyOrders: 134,
};

export const recentPatients = [
  { id: 'P-10234', name: 'Rajesh Kumar', age: 45, gender: 'Male', phone: '+91 98765 43210', department: 'Cardiology', status: 'Active', date: '2026-08-23' },
  { id: 'P-10235', name: 'Priya Sharma', age: 32, gender: 'Female', phone: '+91 87654 32109', department: 'Orthopedics', status: 'Active', date: '2026-08-23' },
  { id: 'P-10236', name: 'Amit Patel', age: 58, gender: 'Male', phone: '+91 76543 21098', department: 'Neurology', status: 'Discharged', date: '2026-08-22' },
  { id: 'P-10237', name: 'Sneha Reddy', age: 28, gender: 'Female', phone: '+91 65432 10987', department: 'Dermatology', status: 'Active', date: '2026-08-23' },
  { id: 'P-10238', name: 'Vikram Singh', age: 67, gender: 'Male', phone: '+91 54321 09876', department: 'Oncology', status: 'Critical', date: '2026-08-22' },
  { id: 'P-10239', name: 'Ananya Iyer', age: 24, gender: 'Female', phone: '+91 43210 98765', department: 'Gynecology', status: 'Active', date: '2026-08-23' },
  { id: 'P-10240', name: 'Mohammed Ali', age: 51, gender: 'Male', phone: '+91 32109 87654', department: 'Pulmonology', status: 'Follow-up', date: '2026-08-21' },
  { id: 'P-10241', name: 'Kavita Deshmukh', age: 39, gender: 'Female', phone: '+91 21098 76543', department: 'ENT', status: 'Active', date: '2026-08-23' },
];

export const appointments = [
  { id: 'A-5001', patient: 'Rajesh Kumar', doctor: 'Dr. Meera Joshi', time: '09:00 AM', department: 'Cardiology', type: 'Follow-up', status: 'Confirmed', date: '2026-08-23' },
  { id: 'A-5002', patient: 'Priya Sharma', doctor: 'Dr. Anil Kulkarni', time: '09:30 AM', department: 'Orthopedics', type: 'Consultation', status: 'Waiting', date: '2026-08-23' },
  { id: 'A-5003', patient: 'Sneha Reddy', doctor: 'Dr. Pooja Nair', time: '10:00 AM', department: 'Dermatology', type: 'Consultation', status: 'In Progress', date: '2026-08-23' },
  { id: 'A-5004', patient: 'Ananya Iyer', doctor: 'Dr. Sunita Rao', time: '10:30 AM', department: 'Gynecology', type: 'Follow-up', status: 'Confirmed', date: '2026-08-23' },
  { id: 'A-5005', patient: 'Kavita Deshmukh', doctor: 'Dr. Ramesh Patil', time: '11:00 AM', department: 'ENT', type: 'Consultation', status: 'Waiting', date: '2026-08-23' },
  { id: 'A-5006', patient: 'Mohammed Ali', doctor: 'Dr. Sanjay Gupta', time: '11:30 AM', department: 'Pulmonology', type: 'Follow-up', status: 'Confirmed', date: '2026-08-23' },
  { id: 'A-5007', patient: 'Vikram Singh', doctor: 'Dr. Meera Joshi', time: '02:00 PM', department: 'Cardiology', type: 'Review', status: 'Scheduled', date: '2026-08-23' },
  { id: 'A-5008', patient: 'Deepak Verma', doctor: 'Dr. Anil Kulkarni', time: '02:30 PM', department: 'Orthopedics', type: 'Post-Op', status: 'Scheduled', date: '2026-08-23' },
];

export const doctors = [
  { id: 'D-101', name: 'Dr. Meera Joshi', department: 'Cardiology', specialization: 'Interventional Cardiology', experience: 15, status: 'Available', patients: 28, rating: 4.8, image: null },
  { id: 'D-102', name: 'Dr. Anil Kulkarni', department: 'Orthopedics', specialization: 'Joint Replacement', experience: 20, status: 'In Surgery', patients: 35, rating: 4.9, image: null },
  { id: 'D-103', name: 'Dr. Pooja Nair', department: 'Dermatology', specialization: 'Cosmetic Dermatology', experience: 10, status: 'Available', patients: 22, rating: 4.7, image: null },
  { id: 'D-104', name: 'Dr. Sunita Rao', department: 'Gynecology', specialization: 'High-Risk Pregnancy', experience: 18, status: 'Available', patients: 30, rating: 4.8, image: null },
  { id: 'D-105', name: 'Dr. Ramesh Patil', department: 'ENT', specialization: 'Head & Neck Surgery', experience: 12, status: 'On Leave', patients: 18, rating: 4.6, image: null },
  { id: 'D-106', name: 'Dr. Sanjay Gupta', department: 'Pulmonology', specialization: 'Critical Care', experience: 16, status: 'Available', patients: 25, rating: 4.7, image: null },
  { id: 'D-107', name: 'Dr. Neha Agarwal', department: 'Neurology', specialization: 'Neurophysiology', experience: 14, status: 'Available', patients: 20, rating: 4.9, image: null },
  { id: 'D-108', name: 'Dr. Vikash Malhotra', department: 'Oncology', specialization: 'Medical Oncology', experience: 22, status: 'In Consultation', patients: 40, rating: 4.8, image: null },
];

export const departments = [
  { name: 'Cardiology', doctors: 8, patients: 156, revenue: 450000, icon: '❤️' },
  { name: 'Orthopedics', doctors: 6, patients: 132, revenue: 380000, icon: '🦴' },
  { name: 'Neurology', doctors: 5, patients: 98, revenue: 320000, icon: '🧠' },
  { name: 'Dermatology', doctors: 4, patients: 180, revenue: 210000, icon: '🧴' },
  { name: 'Gynecology', doctors: 6, patients: 145, revenue: 290000, icon: '👶' },
  { name: 'Pulmonology', doctors: 5, patients: 110, revenue: 260000, icon: '🫁' },
  { name: 'Oncology', doctors: 7, patients: 88, revenue: 520000, icon: '🎗️' },
  { name: 'ENT', doctors: 3, patients: 95, revenue: 180000, icon: '👂' },
];

export const labTests = [
  { id: 'L-8001', patient: 'Rajesh Kumar', test: 'Complete Blood Count', doctor: 'Dr. Meera Joshi', status: 'Completed', date: '2026-08-23', priority: 'Normal' },
  { id: 'L-8002', patient: 'Vikram Singh', test: 'CT Scan - Chest', doctor: 'Dr. Vikash Malhotra', status: 'In Progress', date: '2026-08-23', priority: 'Urgent' },
  { id: 'L-8003', patient: 'Priya Sharma', test: 'X-Ray - Right Knee', doctor: 'Dr. Anil Kulkarni', status: 'Pending', date: '2026-08-23', priority: 'Normal' },
  { id: 'L-8004', patient: 'Sneha Reddy', test: 'Skin Biopsy', doctor: 'Dr. Pooja Nair', status: 'Completed', date: '2026-08-22', priority: 'Normal' },
  { id: 'L-8005', patient: 'Amit Patel', test: 'MRI - Brain', doctor: 'Dr. Neha Agarwal', status: 'Completed', date: '2026-08-22', priority: 'Urgent' },
  { id: 'L-8006', patient: 'Mohammed Ali', test: 'Pulmonary Function Test', doctor: 'Dr. Sanjay Gupta', status: 'Pending', date: '2026-08-23', priority: 'Normal' },
];

export const pharmacyItems = [
  { id: 'M-3001', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 2500, batch: 'B-2024-101', expiry: '2027-06', price: 85, status: 'In Stock' },
  { id: 'M-3002', name: 'Paracetamol 650mg', category: 'Analgesics', stock: 5000, batch: 'B-2024-205', expiry: '2027-03', price: 25, status: 'In Stock' },
  { id: 'M-3003', name: 'Metformin 500mg', category: 'Antidiabetic', stock: 1800, batch: 'B-2024-089', expiry: '2026-12', price: 45, status: 'In Stock' },
  { id: 'M-3004', name: 'Atorvastatin 10mg', category: 'Cardiovascular', stock: 150, batch: 'B-2024-156', expiry: '2027-01', price: 120, status: 'Low Stock' },
  { id: 'M-3005', name: 'Omeprazole 20mg', category: 'Gastrointestinal', stock: 3200, batch: 'B-2024-178', expiry: '2027-08', price: 55, status: 'In Stock' },
  { id: 'M-3006', name: 'Insulin Glargine', category: 'Antidiabetic', stock: 45, batch: 'B-2024-201', expiry: '2026-10', price: 850, status: 'Low Stock' },
  { id: 'M-3007', name: 'Cetirizine 10mg', category: 'Antihistamine', stock: 4500, batch: 'B-2024-220', expiry: '2027-11', price: 30, status: 'In Stock' },
  { id: 'M-3008', name: 'Amlodipine 5mg', category: 'Cardiovascular', stock: 2800, batch: 'B-2024-145', expiry: '2027-05', price: 65, status: 'In Stock' },
];

export const billingData = [
  { id: 'INV-9001', patient: 'Rajesh Kumar', type: 'Consultation', amount: 1500, status: 'Paid', date: '2026-08-23', method: 'UPI' },
  { id: 'INV-9002', patient: 'Priya Sharma', type: 'X-Ray', amount: 2500, status: 'Pending', date: '2026-08-23', method: 'Cash' },
  { id: 'INV-9003', patient: 'Amit Patel', type: 'MRI Scan', amount: 8500, status: 'Paid', date: '2026-08-22', method: 'Insurance' },
  { id: 'INV-9004', patient: 'Sneha Reddy', type: 'Lab Tests', amount: 3200, status: 'Paid', date: '2026-08-23', method: 'Card' },
  { id: 'INV-9005', patient: 'Vikram Singh', type: 'IPD Charges', amount: 45000, status: 'Partial', date: '2026-08-22', method: 'Insurance' },
  { id: 'INV-9006', patient: 'Mohammed Ali', type: 'Consultation', amount: 1500, status: 'Paid', date: '2026-08-21', method: 'UPI' },
];

export const bedOccupancy = [
  { ward: 'General Ward', total: 50, occupied: 42, available: 8 },
  { ward: 'Semi-Private', total: 30, occupied: 24, available: 6 },
  { ward: 'Private Room', total: 20, occupied: 16, available: 4 },
  { ward: 'ICU', total: 15, occupied: 12, available: 3 },
  { ward: 'NICU', total: 10, occupied: 7, available: 3 },
  { ward: 'Emergency', total: 12, occupied: 8, available: 4 },
];

export const revenueData = [
  { month: 'Jan', revenue: 1850000, expenses: 1200000 },
  { month: 'Feb', revenue: 2100000, expenses: 1350000 },
  { month: 'Mar', revenue: 1950000, expenses: 1280000 },
  { month: 'Apr', revenue: 2300000, expenses: 1420000 },
  { month: 'May', revenue: 2450000, expenses: 1500000 },
  { month: 'Jun', revenue: 2200000, expenses: 1380000 },
  { month: 'Jul', revenue: 2600000, expenses: 1550000 },
  { month: 'Aug', revenue: 2450000, expenses: 1480000 },
];

export const patientFlowData = [
  { day: 'Mon', opd: 145, ipd: 32, emergency: 12 },
  { day: 'Tue', opd: 132, ipd: 28, emergency: 15 },
  { day: 'Wed', opd: 158, ipd: 35, emergency: 10 },
  { day: 'Thu', opd: 142, ipd: 30, emergency: 18 },
  { day: 'Fri', opd: 165, ipd: 38, emergency: 14 },
  { day: 'Sat', opd: 120, ipd: 25, emergency: 20 },
  { day: 'Sun', opd: 85, ipd: 22, emergency: 22 },
];

export const employees = [
  { id: 'E-201', name: 'Dr. Meera Joshi', role: 'Senior Cardiologist', department: 'Cardiology', status: 'Active', attendance: '96%', joinDate: '2018-03-15' },
  { id: 'E-202', name: 'Ramesh Babu', role: 'Head Nurse', department: 'ICU', status: 'Active', attendance: '98%', joinDate: '2019-07-01' },
  { id: 'E-203', name: 'Sunita Kulkarni', role: 'Lab Technician', department: 'Pathology', status: 'Active', attendance: '94%', joinDate: '2020-01-10' },
  { id: 'E-204', name: 'Manoj Tiwari', role: 'Pharmacist', department: 'Pharmacy', status: 'Active', attendance: '97%', joinDate: '2021-05-20' },
  { id: 'E-205', name: 'Priya Desai', role: 'Receptionist', department: 'Front Desk', status: 'Active', attendance: '99%', joinDate: '2022-02-14' },
  { id: 'E-206', name: 'Arun Shinde', role: 'Ambulance Driver', department: 'Emergency', status: 'On Duty', attendance: '95%', joinDate: '2020-09-01' },
];

export const inventoryItems = [
  { id: 'INV-401', name: 'Surgical Gloves (Box)', category: 'Surgical Supplies', stock: 500, reorderLevel: 100, supplier: 'MedSupply Co.', status: 'In Stock' },
  { id: 'INV-402', name: 'IV Cannula 18G', category: 'IV Supplies', stock: 80, reorderLevel: 200, supplier: 'HealthEquip', status: 'Low Stock' },
  { id: 'INV-403', name: 'Surgical Masks N95', category: 'PPE', stock: 2000, reorderLevel: 500, supplier: 'SafeGuard', status: 'In Stock' },
  { id: 'INV-404', name: 'Syringes 5ml', category: 'Disposables', stock: 3500, reorderLevel: 1000, supplier: 'MedSupply Co.', status: 'In Stock' },
  { id: 'INV-405', name: 'Bandage Rolls', category: 'Wound Care', stock: 150, reorderLevel: 300, supplier: 'WoundCare Ltd', status: 'Low Stock' },
  { id: 'INV-406', name: 'ECG Electrodes', category: 'Diagnostic', stock: 800, reorderLevel: 200, supplier: 'CardioTech', status: 'In Stock' },
];

export const emergencyCases = [
  { id: 'EM-701', patient: 'Unknown Male', age: '~40', condition: 'Road Accident - Multiple Fractures', priority: 'Critical', time: '08:45 AM', doctor: 'Dr. Sanjay Gupta', status: 'In Treatment' },
  { id: 'EM-702', patient: 'Lakshmi Devi', age: 72, condition: 'Cardiac Arrest', priority: 'Critical', time: '09:15 AM', doctor: 'Dr. Meera Joshi', status: 'Stabilized' },
  { id: 'EM-703', patient: 'Rohit Jain', age: 35, condition: 'Severe Allergic Reaction', priority: 'High', time: '10:30 AM', doctor: 'Dr. Pooja Nair', status: 'Under Observation' },
  { id: 'EM-704', patient: 'Baby Aarav', age: '2 yrs', condition: 'High Fever with Seizures', priority: 'High', time: '11:00 AM', doctor: 'Dr. Sunita Rao', status: 'In Treatment' },
];
