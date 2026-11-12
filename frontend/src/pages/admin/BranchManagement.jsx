import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiMapPin,
  FiPhone,
  FiMail,
  FiX,
  FiLayers,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPower,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiMoreVertical,
  FiGlobe,
  FiFileText,
  FiActivity,
} from "react-icons/fi";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import { api } from "../../api/client";

const emptyForm = {
  hospital: "",
  name: "",
  branchCode: "",
  phone: "",
  email: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  status: "ACTIVE",
  logo: "",
  website: "",
  description: "",
  landmark: "",
  registrationNumber: "",
};

const ITEMS_PER_PAGE = 8;

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadBranches = async () => {
    try {
      const data = await api.get("/branches/");

      const list = Array.isArray(data)
        ? data
        : data?.results || data?.data || [];

      if (list.length > 0) {
        setBranches(list);
      }
    } catch (error) {
      console.error("Failed to load branches:", error);
    }
  };

  const loadHospitals = async () => {
    try {
      const data = await api.get("/hospitals/hospitals/");

      const list = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];

      setHospitals(list);

      if (list.length > 0) {
        const activeHospital = list.find(
          (hospital) => hospital.status === "ACTIVE",
        );

        setFormData((prev) => ({
          ...prev,
          hospital: prev.hospital || activeHospital?.id || list[0]?.id || "",
        }));
      }
    } catch (error) {
      console.error("Failed to load hospitals:", error);
    }
  };

  const loadData = async () => {
    setRefreshing(true);

    try {
      await Promise.all([loadBranches(), loadHospitals()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total = branches.length;

    const active = branches.filter(
      (branch) => branch.status === "ACTIVE",
    ).length;

    const inactive = branches.filter(
      (branch) => branch.status === "INACTIVE",
    ).length;

    const pending = branches.filter(
      (branch) =>
        branch.status === "PENDING" || branch.status === "PENDING_APPROVAL",
    ).length;

    return {
      total,
      active,
      inactive,
      pending,
    };
  }, [branches]);

  /* =========================================================
     FORM
  ========================================================= */

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    const firstActiveHospital = hospitals.find(
      (hospital) => hospital.status === "ACTIVE",
    );

    setFormData({
      ...emptyForm,
      hospital: firstActiveHospital?.id || "",
    });
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);

    setFormData({
      hospital: branch.hospital || "",
      name: branch.name || "",
      branchCode: branch.branch_code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      addressLine1: branch.address_line_1 || "",
      city: branch.city || "",
      state: branch.state || "",
      postalCode: branch.postal_code || "",
      status: branch.status || "ACTIVE",
      logo: branch.logo || "",
      website: branch.website || "",
      description: branch.description || "",
      landmark: branch.landmark || "",
      registrationNumber: branch.registration_number || "",
    });

    setShowModal(true);
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      hospital: formData.hospital || hospitals[0]?.id || 1,

      name: formData.name.trim(),

      branch_code: formData.branchCode.trim().toUpperCase(),

      phone: formData.phone.replace(/[^0-9]/g, ""),

      email: formData.email.trim(),

      address_line_1: formData.addressLine1.trim(),

      city: formData.city.trim(),

      state: formData.state.trim(),

      postal_code: formData.postalCode.trim(),

      status: formData.status,
    };

    try {
      if (editingBranch) {
        const result = await api.patch(
          `/branches/${editingBranch.id}/`,
          payload,
        );

        const updatedBranch = result?.data || result;

        setBranches((prev) =>
          prev.map((branch) =>
            branch.id === editingBranch.id
              ? {
                  ...branch,
                  ...updatedBranch,
                }
              : branch,
          ),
        );

        toast.success("Branch updated successfully!");
      } else {
        const result = await api.post("/branches/", payload);

        const newBranch = result?.data || result;

        setBranches((prev) => [newBranch, ...prev]);

        toast.success("Branch added and saved to database!");
      }

      setShowModal(false);
      setEditingBranch(null);
      resetForm();
    } catch (err) {
      toast.error(
        err.message || `Failed to ${editingBranch ? "update" : "add"} branch.`,
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     VIEW
  ========================================================= */

  const openView = (branch) => {
    setSelectedBranch(branch);
    setShowDetails(true);
  };

  /* =========================================================
     ACTIVATE / DEACTIVATE
  ========================================================= */

  const handleStatusChange = async (branch) => {
    const isActive = branch.status === "ACTIVE";

    const nextStatus = isActive ? "INACTIVE" : "ACTIVE";

    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${branch.name}"?`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await api.patch(`/branches/${branch.id}/`, {
        status: nextStatus,
      });

      const updatedBranch = result?.data || result;

      setBranches((prev) =>
        prev.map((item) =>
          item.id === branch.id
            ? {
                ...item,
                ...updatedBranch,
                status: updatedBranch?.status || nextStatus,
              }
            : item,
        ),
      );

      setSelectedBranch((prev) =>
        prev?.id === branch.id
          ? {
              ...prev,
              ...updatedBranch,
              status: updatedBranch?.status || nextStatus,
            }
          : prev,
      );

      toast.success(`Branch ${action}d successfully.`);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} branch.`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (branch) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${branch.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      await api.delete(`/branches/${branch.id}/`);

      setBranches((prev) => prev.filter((item) => item.id !== branch.id));

      if (selectedBranch?.id === branch.id) {
        setSelectedBranch(null);
        setShowDetails(false);
      }

      toast.success("Branch deleted successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to delete branch.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredBranches = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return branches.filter((branch) => {
      const matchSearch =
        branch.name?.toLowerCase().includes(searchValue) ||
        branch.branch_code?.toLowerCase().includes(searchValue) ||
        branch.city?.toLowerCase().includes(searchValue) ||
        branch.hospital_name?.toLowerCase().includes(searchValue);

      const matchStatus =
        statusFilter === "ALL" || branch.status === statusFilter;

      const matchHospital =
        hospitalFilter === "ALL" ||
        String(branch.hospital) === String(hospitalFilter);

      return matchSearch && matchStatus && matchHospital;
    });
  }, [branches, search, statusFilter, hospitalFilter]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBranches.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  /* =========================================================
     DETAILS PAGE
  ========================================================= */

  if (showDetails && selectedBranch) {
    return (
      <BranchDetailsPage
        branch={selectedBranch}
        onBack={() => {
          setShowDetails(false);
          setSelectedBranch(null);
        }}
        onEdit={() => {
          setShowDetails(false);
          openEditModal(selectedBranch);
        }}
        onStatusChange={() => handleStatusChange(selectedBranch)}
        onDelete={() => handleDelete(selectedBranch)}
        loading={loading}
      />
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Branch Management"
        action={
          <button
            onClick={openCreateModal}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30"
          >
            <FiPlus
              size={17}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            Add Branch
          </button>
        }
      />

      {/* =====================================================
          PREMIUM STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Branches"
          value={stats.total}
          icon={FiLayers}
          color="blue"
        />

        <StatCard
          title="Active Branches"
          value={stats.active}
          description="Currently operational"
          icon={FiCheckCircle}
          color="green"
        />

        <StatCard
          title="Inactive Branches"
          value={stats.inactive}
          description="Currently disabled"
          icon={FiPower}
          color="red"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          description="Awaiting approval"
          icon={FiClock}
          color="orange"
        />
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/40">
          <div className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  <FiLayers size={20} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">
                      Hospital Branches
                    </h3>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                      {filteredBranches.length} Records
                    </span>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex w-full flex-col gap-3 lg:flex-row xl:w-auto">
                <div className="group relative flex h-11 w-full items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 sm:w-[300px]">
                  <FiSearch
                    size={17}
                    className="shrink-0 text-slate-400 transition-colors group-focus-within:text-amber-500"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search branch, code, city..."
                    className="ml-2 w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCurrentPage(1);
                      }}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <FiX size={15} />
                    </button>
                  )}
                </div>

                {/* Hospital Filter */}
                <div className="relative">
                  <FiHome
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={hospitalFilter}
                    onChange={(e) => {
                      setHospitalFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-11 w-full min-w-[190px] appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-medium text-slate-600 outline-none shadow-sm transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                  >
                    <option value="ALL">All Hospitals</option>

                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <FiActivity
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-11 w-full min-w-[150px] appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-medium text-slate-600 outline-none shadow-sm transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={loadData}
                  disabled={refreshing}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {(search || hospitalFilter !== "ALL" || statusFilter !== "ALL") && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <div className="mr-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <FiFilter size={13} />
                  Active filters:
                </div>

                {search && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    Search: {search}
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCurrentPage(1);
                      }}
                      className="rounded-full p-0.5 hover:bg-blue-100"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                )}

                {hospitalFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
                    <FiHome size={12} />
                    Hospital
                    <button
                      type="button"
                      onClick={() => {
                        setHospitalFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className="rounded-full p-0.5 hover:bg-purple-100"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                )}

                {statusFilter !== "ALL" && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                      statusFilter === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : statusFilter === "INACTIVE"
                          ? "bg-red-50 text-red-700 ring-red-100"
                          : "bg-amber-50 text-amber-700 ring-amber-100"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />

                    {statusFilter === "ACTIVE"
                      ? "Active"
                      : statusFilter === "INACTIVE"
                        ? "Inactive"
                        : "Pending"}

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className="rounded-full p-0.5 hover:bg-black/5"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setHospitalFilter("ALL");
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="ml-auto text-xs font-bold text-red-500 transition hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Branch
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hospital
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Location
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Contact
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedBranches.map((branch) => {
                const active = branch.status === "ACTIVE";

                return (
                  <tr
                    key={branch.id}
                    className="group transition-all duration-200 hover:bg-amber-50/30"
                  >
                    {/* Branch */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                          <FiLayers size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {branch.name}
                          </p>

                          <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                            {branch.branch_code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Hospital */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                          <FiHome size={14} />
                        </div>

                        <span className="max-w-[210px] truncate text-sm font-medium text-slate-700">
                          {branch.hospital_name ||
                            `Hospital #${branch.hospital}`}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                          <FiMapPin size={14} />
                        </div>

                        <span className="text-sm text-slate-600">
                          {branch.city
                            ? `${branch.city}, ${branch.state || ""}`
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        {branch.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <FiPhone size={12} className="text-emerald-500" />
                            {branch.phone}
                          </div>
                        )}

                        {branch.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FiMail size={12} className="text-blue-500" />

                            <span className="max-w-[180px] truncate">
                              {branch.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={branch.status || "ACTIVE"} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionButton
                          title="View Branch"
                          onClick={() => openView(branch)}
                          className="text-blue-500 hover:bg-blue-50"
                        >
                          <FiEye size={15} />
                        </ActionButton>

                        <ActionButton
                          title="Edit Branch"
                          onClick={() => openEditModal(branch)}
                          className="text-purple-500 hover:bg-purple-50"
                        >
                          <FiEdit2 size={15} />
                        </ActionButton>

                        <ActionButton
                          title={
                            active ? "Deactivate Branch" : "Activate Branch"
                          }
                          disabled={loading}
                          className={
                            active
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }
                          onClick={() => handleStatusChange(branch)}
                        >
                          <FiPower size={15} />
                        </ActionButton>

                        <ActionButton
                          title="Delete Branch"
                          disabled={loading}
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(branch)}
                        >
                          <FiTrash2 size={15} />
                        </ActionButton>

                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <FiMoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!paginatedBranches.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <FiLayers size={27} />
                      </div>

                      <p className="font-bold text-slate-700">
                        No branches found
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Try changing your search or filters.
                      </p>

                      {(search ||
                        hospitalFilter !== "ALL" ||
                        statusFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setHospitalFilter("ALL");
                            setStatusFilter("ALL");
                            setCurrentPage(1);
                          }}
                          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBranches.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-700">
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredBranches.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {filteredBranches.length}
              </span>{" "}
              branches
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft size={15} />
              </button>

              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${
                    currentPage === page
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  {editingBranch ? (
                    <FiEdit2 size={18} />
                  ) : (
                    <FiLayers size={19} />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingBranch ? "Edit Branch" : "Create New Branch"}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {editingBranch
                      ? "Update branch information and operational details."
                      : "Add a new Hospital's branch."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7 p-6">
              {/* Branch Information */}
              <div>
                <SectionTitle title="Branch Information" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Select Hospital" required>
                      <select
                        required
                        name="hospital"
                        value={formData.hospital}
                        onChange={handleInputChange}
                        className="input-field text-sm"
                      >
                        <option value="">Select active hospital</option>

                        {hospitals
                          .filter(
                            (hospital) =>
                              hospital.status === "ACTIVE" ||
                              String(hospital.id) ===
                                String(editingBranch?.hospital),
                          )
                          .map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}
                              {hospital.hospital_code
                                ? ` (${hospital.hospital_code})`
                                : ""}
                            </option>
                          ))}
                      </select>

                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Only active hospitals can receive new branches.
                      </p>
                    </FormField>
                  </div>

                  <FormField label="Branch Name" required>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Pune Central Branch"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="Branch Code" required>
                    <input
                      required
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleInputChange}
                      placeholder="e.g. PUNE-01"
                      className="input-field text-sm uppercase"
                    />
                  </FormField>

                  <FormField label="Phone">
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="Email">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="branch@hospital.com"
                      className="input-field text-sm"
                    />
                  </FormField>
                </div>
              </div>

              {/* Location */}
              <div>
                <SectionTitle title="Location Details" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Address">
                      <input
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        placeholder="Street / Campus address"
                        className="input-field text-sm"
                      />
                    </FormField>
                  </div>

                  <FormField label="City">
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="State">
                    <input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="Postal Code">
                    <input
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Pincode"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="Landmark">
                    <input
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="Nearby landmark"
                      className="input-field text-sm"
                    />
                  </FormField>
                </div>
              </div>

              {/* Additional */}
              <div>
                <SectionTitle title="Additional Information" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Website">
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://hospital.com"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <FormField label="Registration Number">
                    <input
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      placeholder="Hospital registration number"
                      className="input-field text-sm"
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Branch Description">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Short description about this branch..."
                        className="input-field resize-none text-sm"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="min-w-[140px] rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Saving..."
                    : editingBranch
                      ? "Update Branch"
                      : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BRANCH DETAILS PAGE
============================================================ */

function BranchDetailsPage({
  branch,
  onBack,
  onEdit,
  onStatusChange,
  onDelete,
  loading,
}) {
  const active = branch.status === "ACTIVE";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
            title="Back"
          >
            <FiChevronLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Branch Details
              </h1>

              <StatusBadge status={branch.status || "ACTIVE"} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <FiEdit2 size={14} />
            Edit
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onStatusChange}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              active
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <FiPower size={14} />

            {active ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onDelete}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/20">
              <FiLayers size={34} />
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Branch
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {branch.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-orange-700 ring-1 ring-orange-100">
                  {branch.branch_code}
                </span>

                <span className="text-xs text-slate-500">
                  {branch.hospital_name || `Hospital #${branch.hospital}`}
                </span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-slate-400">Current Status</p>

              <p
                className={`mt-1 text-lg font-bold ${
                  active ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {active ? "Operational" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <SectionTitle title="Branch Information" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailBox
              label="Branch Name"
              value={branch.name}
              icon={FiLayers}
            />

            <DetailBox
              label="Branch Code"
              value={branch.branch_code}
              icon={FiFileText}
            />

            <DetailBox
              label="Hospital"
              value={branch.hospital_name || `Hospital #${branch.hospital}`}
              icon={FiHome}
            />

            <DetailBox
              label="Status"
              value={branch.status || "ACTIVE"}
              icon={FiCheckCircle}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Contact" />

          <div className="space-y-4">
            <ContactRow icon={FiPhone} label="Phone" value={branch.phone} />

            <ContactRow icon={FiMail} label="Email" value={branch.email} />

            <ContactRow
              icon={FiGlobe}
              label="Website"
              value={branch.website || "Not available"}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle title="Location Details" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailBox
            label="Address"
            value={branch.address_line_1}
            icon={FiMapPin}
          />

          <DetailBox label="City" value={branch.city} icon={FiMapPin} />

          <DetailBox label="State" value={branch.state} icon={FiMapPin} />

          <DetailBox
            label="Postal Code"
            value={branch.postal_code}
            icon={FiMapPin}
          />
        </div>
      </div>

      {/* Additional */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle title="Additional Information" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailBox
            label="Registration Number"
            value={branch.registration_number}
            icon={FiFileText}
          />

          <DetailBox label="Landmark" value={branch.landmark} icon={FiMapPin} />

          <DetailBox
            label="Description"
            value={branch.description}
            icon={FiFileText}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ title, value, description, icon: Icon, color = "blue" }) {
  const themes = {
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      glow: "bg-blue-500/20",
      text: "text-blue-600",
      ring: "ring-blue-100",
      bar: "from-blue-500 to-indigo-500",
    },

    green: {
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-500/20",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
      bar: "from-emerald-500 to-teal-500",
    },

    orange: {
      gradient: "from-orange-500 to-amber-600",
      glow: "bg-orange-500/20",
      text: "text-orange-600",
      ring: "ring-orange-100",
      bar: "from-orange-500 to-amber-500",
    },

    red: {
      gradient: "from-red-500 to-rose-600",
      glow: "bg-red-500/20",
      text: "text-red-600",
      ring: "ring-red-100",
      bar: "from-red-500 to-rose-500",
    },
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full ${theme.glow} blur-3xl transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value ?? 0}
          </h3>

          <p className="mt-1.5 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>
      </div>

      <div className="relative mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full w-2/5 rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-500 group-hover:w-3/5`}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`h-2.5 w-2.5 rounded-full ${theme.text.replace(
            "text-",
            "bg-",
          )} ring-4 ${theme.ring}`}
        />
      </div>
    </div>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  children,
  title,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  const normalized = status || "ACTIVE";

  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",

    INACTIVE: "bg-red-50 text-red-700 ring-red-100",

    PENDING: "bg-amber-50 text-amber-700 ring-amber-100",

    PENDING_APPROVAL: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  const labels = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending",
    PENDING_APPROVAL: "Pending Approval",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
        styles[normalized] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {labels[normalized] || normalized}
    </span>
  );
}

/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({ title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />

      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

/* ============================================================
   DETAIL BOX
============================================================ */

function DetailBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {Icon && <Icon size={14} />}

        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-700">
        {value || "Not available"}
      </p>
    </div>
  );
}

/* ============================================================
   CONTACT ROW
============================================================ */

function ContactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-medium text-slate-700">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}
