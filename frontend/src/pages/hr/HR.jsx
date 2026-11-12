import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiDollarSign,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { employees as mockEmployees } from "../../utils/mockData";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import { api } from "../../api/client";

export default function HR() {
  const [employeeList, setEmployeeList] = useState(mockEmployees);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    branch: "",
    licenseNumber: "",
    shift: "Morning",
    assignedWard: "General Ward",
  });

  useEffect(() => {
    // Load nurses
    api
      .get("/nurses/")
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.results || data?.data || [];
        if (list.length > 0) {
          const mapped = list.map((n) => ({
            id: `NUR-${n.id}`,
            name: `${n.first_name} ${n.last_name}`,
            role: "Staff Nurse",
            department: n.assigned_ward || "Nursing Station",
            status: "Active",
            attendance: "96%",
            joinDate: "2024-03-15",
          }));
          setEmployeeList((prev) => [
            ...mapped,
            ...prev.filter((e) => !e.id.startsWith("NUR-")),
          ]);
        }
      })
      .catch(() => {});

    // Load branches for modal
    api
      .get("/branches/")
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.results || data?.data || [];
        setBranches(list);
        if (list.length > 0) {
          setFormData((prev) => ({
            ...prev,
            branch: prev.branch || list[0].id,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddNurse = async (e) => {
    e.preventDefault();
    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      phone: "9876543210",
      email: `nurse.${formData.firstName.toLowerCase() || "staff"}@medicore.com`,
      branch: formData.branch || branches[0]?.id || 1,
      license_number: formData.licenseNumber.trim().toUpperCase(),
      shift: formData.shift,
      assigned_ward: formData.assignedWard.trim(),
    };

    try {
      const res = await api.post("/nurses/", payload);
      const created = res.data || res;
      const newEmp = {
        id: `NUR-${created.id || Date.now()}`,
        name: `${created.first_name} ${created.last_name}`,
        role: "Staff Nurse",
        department: created.assigned_ward || "Nursing Ward",
        status: "Active",
        attendance: "100%",
        joinDate: new Date().toISOString().split("T")[0],
      };
      setEmployeeList((prev) => [newEmp, ...prev]);
      toast.success("Nurse registered and saved to database!");
      setShowModal(false);
      setFormData({
        firstName: "",
        lastName: "",
        branch: branches[0]?.id || "",
        licenseNumber: "",
        shift: "Morning",
        assignedWard: "General Ward",
      });
    } catch (err) {
      toast.error(err.message || "Failed to register nurse.");
    }
  };

  return (
    <div>
      <PageHeader
        title="HR & Staff Management"
        subtitle="Employee records, attendance tracking, and payroll management"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm">Generate Payroll</button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <FiPlus size={16} /> Add Nurse / Staff
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Staff",
            value: employeeList.length.toString(),
            icon: <FiUsers />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Present Today",
            value: "256",
            icon: <FiUserCheck />,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "On Leave",
            value: "18",
            icon: <FiUserX />,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Monthly Payroll",
            value: "₹42.5L",
            icon: <FiDollarSign />,
            color: "bg-purple-50 text-purple-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Employee Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department / Ward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Join Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employeeList.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-medicore-400 to-medicore-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {emp.name}
                        </p>
                        <p className="text-xs text-gray-400">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {emp.role}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-info">{emp.department}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        emp.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: emp.attendance }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {emp.attendance}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {emp.joinDate}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg hover:bg-medicore-100">
                        Profile
                      </button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">
                        Pay Slip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Nurse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiPlus className="text-medicore-600" /> Add New Nurse /
                Clinical Staff
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNurse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sunita"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rane"
                    className="input-field text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hospital Branch *
                  </label>
                  <select
                    required
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="input-field text-sm"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nursing License Number *
                  </label>
                  <input
                    required
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. NUR-MH-9912"
                    className="input-field text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Shift *
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="input-field text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assigned Ward / Station *
                  </label>
                  <input
                    required
                    name="assignedWard"
                    value={formData.assignedWard}
                    onChange={handleInputChange}
                    placeholder="e.g. ICU - Ward A"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
