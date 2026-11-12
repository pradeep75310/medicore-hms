import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiFileText,
  FiHash,
  FiLayers,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiDownload,
  FiPower,
  FiHome,
  FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import { departmentApi, branchApi } from "../../api/service";

const ITEMS_PER_PAGE = 8;

const emptyForm = {
  branch: "",
  name: "",
  code: "",
  description: "",
  status: "ACTIVE",
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  return data?.results || data?.data || [];
};

const getStatus = (department) =>
  String(department?.status || "INACTIVE").toUpperCase();

const isActive = (department) => getStatus(department) === "ACTIVE";

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const getStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (normalized === "PENDING") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border border-slate-200";
};

const getStatusDot = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") return "bg-emerald-500";
  if (normalized === "PENDING") return "bg-amber-500";

  return "bg-slate-400";
};

const getBranchName = (department) => {
  if (!department?.branch) return "—";

  if (typeof department.branch === "object") {
    return (
      department.branch.name ||
      department.branch.branch_name ||
      department.branch.title ||
      "—"
    );
  }

  return department.branch_name || department.branchName || "—";
};

const getHospitalName = (department) => {
  if (department?.hospital_name) return department.hospital_name;

  if (department?.hospital) {
    if (typeof department.hospital === "object") {
      return (
        department.hospital.name ||
        department.hospital.hospital_name ||
        department.hospital.title ||
        "—"
      );
    }

    return String(department.hospital);
  }

  if (
    department?.branch &&
    typeof department.branch === "object" &&
    department.branch.hospital
  ) {
    if (typeof department.branch.hospital === "object") {
      return (
        department.branch.hospital.name ||
        department.branch.hospital.hospital_name ||
        "—"
      );
    }

    return String(department.branch.hospital);
  }

  return department?.branch_hospital_name || "—";
};

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadBranches = async () => {
    const data = await branchApi.list();
    setBranches(normalizeList(data));
  };

  const loadDepartments = async () => {
    setLoading(true);

    try {
      const params = {};

      if (branchFilter) params.branch = branchFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const data = await departmentApi.list(params);

      setDepartments(normalizeList(data));
    } catch (error) {
      toast.error(error.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches().catch((error) => {
      toast.error(error.message || "Failed to load branches.");
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDepartments();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, branchFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, branchFilter, statusFilter]);

  const totalDepartments = departments.length;

  const activeCount = useMemo(
    () =>
      departments.filter((department) => getStatus(department) === "ACTIVE")
        .length,
    [departments],
  );

  const inactiveCount = useMemo(
    () =>
      departments.filter((department) => getStatus(department) === "INACTIVE")
        .length,
    [departments],
  );

  const pendingCount = useMemo(
    () =>
      departments.filter((department) => getStatus(department) === "PENDING")
        .length,
    [departments],
  );

  const totalPages = Math.max(1, Math.ceil(totalDepartments / ITEMS_PER_PAGE));

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return departments.slice(start, start + ITEMS_PER_PAGE);
  }, [departments, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      branch:
        branchFilter ||
        branches.find(
          (branch) =>
            String(branch.status || "ACTIVE").toUpperCase() === "ACTIVE",
        )?.id ||
        "",
    });

    setShowModal(true);
  };

  const openEdit = (department) => {
    setEditingId(department.id);

    setForm({
      branch: department.branch || "",
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      status: department.status || "ACTIVE",
    });

    setShowModal(true);
  };

  const openView = async (department) => {
    try {
      const data = await departmentApi.get(department.id);

      setSelectedDepartment(data?.data || data);
    } catch {
      setSelectedDepartment(department);
    }
  };

  const closeView = () => {
    setSelectedDepartment(null);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.branch) {
      toast.error("Please select a branch.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Department code is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        branch: Number(form.branch),
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status,
      };

      if (editingId) {
        await departmentApi.update(editingId, payload);

        toast.success("Department updated successfully.");
      } else {
        await departmentApi.create(payload);

        toast.success("Department created successfully.");
      }

      closeModal();

      await loadDepartments();
    } catch (error) {
      toast.error(error.message || "Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (department, nextStatus) => {
    setActionLoadingId(department.id);

    try {
      await departmentApi.update(department.id, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === "ACTIVE"
          ? "Department activated successfully."
          : "Department deactivated successfully.",
      );

      setDepartments((previous) =>
        previous.map((item) =>
          item.id === department.id ? { ...item, status: nextStatus } : item,
        ),
      );

      setSelectedDepartment((previous) =>
        previous?.id === department.id
          ? { ...previous, status: nextStatus }
          : previous,
      );
    } catch (error) {
      toast.error(error.message || "Unable to change department status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const activateDepartment = (department) => changeStatus(department, "ACTIVE");

  const deactivateDepartment = (department) =>
    changeStatus(department, "INACTIVE");

  const handleDelete = async (department) => {
    const confirmed = window.confirm(`Delete "${department.name}"?`);

    if (!confirmed) return;

    setActionLoadingId(department.id);

    try {
      await departmentApi.remove(department.id);

      toast.success("Department deleted successfully.");

      setDepartments((previous) =>
        previous.filter((item) => item.id !== department.id),
      );

      if (selectedDepartment?.id === department.id) {
        setSelectedDepartment(null);
      }
    } catch (error) {
      toast.error(error.message || "Unable to delete department.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([loadBranches(), loadDepartments()]);

      toast.success("Department data refreshed.");
    } catch {
      toast.error("Unable to refresh department data.");
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setBranchFilter("");
    setCurrentPage(1);
  };

  const handleExportExcel = () =>
    toast("Excel export is ready to connect.", {
      icon: "📊",
    });

  const handleExportPDF = () =>
    toast("PDF export is ready to connect.", {
      icon: "📄",
    });

  if (selectedDepartment) {
    return (
      <DepartmentDetails
        department={selectedDepartment}
        onBack={closeView}
        onEdit={() => {
          openEdit(selectedDepartment);
          setSelectedDepartment(null);
        }}
        onActivate={() => activateDepartment(selectedDepartment)}
        onDeactivate={() => deactivateDepartment(selectedDepartment)}
        actionLoading={actionLoadingId === selectedDepartment.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Department Management"
          action={
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
              >
                <FiDownload size={16} />
                Excel
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100"
              >
                <FiFileText size={16} />
                PDF
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-xl"
              >
                <FiPlus size={17} />
                Add Department
              </button>
            </div>
          }
        />

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Departments"
            value={totalDepartments}
            subtitle="All departments"
            icon={<FiLayers size={21} />}
            iconClass="from-indigo-500 to-violet-600"
            glowClass="bg-indigo-500/10"
            barClass="from-indigo-500 to-violet-500"
          />

          <StatCard
            title="Active"
            value={activeCount}
            subtitle="Currently operational"
            icon={<FiCheckCircle size={21} />}
            iconClass="from-emerald-500 to-teal-600"
            glowClass="bg-emerald-500/10"
            barClass="from-emerald-500 to-teal-500"
          />

          <StatCard
            title="Pending"
            value={pendingCount}
            subtitle="Awaiting action"
            icon={<FiClock size={21} />}
            iconClass="from-amber-500 to-orange-600"
            glowClass="bg-amber-500/10"
            barClass="from-amber-500 to-orange-500"
          />

          <StatCard
            title="Inactive"
            value={inactiveCount}
            subtitle="Currently disabled"
            icon={<FiPower size={21} />}
            iconClass="from-rose-500 to-red-600"
            glowClass="bg-rose-500/10"
            barClass="from-rose-500 to-red-500"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Department
              </label>

              <div className="relative">
                <FiSearch
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search department name or code..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Branch
              </label>

              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="">All Branches</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name || branch.branch_name || branch.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex items-end lg:col-span-2">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  <FiLayers size={18} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Departments
                  </h2>

                  <p className="text-xs text-slate-500">
                    Manage all hospital departments
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {totalDepartments === 0
                  ? 0
                  : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalDepartments)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {totalDepartments}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Code
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Branch
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Hospital
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Created
                  </th>

                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          Loading departments...
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Please wait while we fetch department data.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FiLayers size={28} />
                        </div>

                        <h3 className="mt-4 text-base font-bold text-slate-700">
                          No departments found
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-slate-400">
                          Try changing your filters or create a new department.
                        </p>

                        <button
                          type="button"
                          onClick={openCreate}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-600 hover:to-orange-700"
                        >
                          <FiPlus size={16} />
                          Add Department
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((department) => {
                    const active = isActive(department);
                    const actionLoading = actionLoadingId === department.id;

                    return (
                      <tr
                        key={department.id}
                        className="group transition-colors hover:bg-amber-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
                              <FiLayers size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {department.name || "—"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                ID: {department.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700">
                            <FiHash size={13} />
                            {department.code || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FiMapPin size={15} />
                            </div>

                            <span className="text-sm font-medium text-slate-700">
                              {getBranchName(department)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                              <FiHome size={15} />
                            </div>

                            <span className="text-sm text-slate-600">
                              {getHospitalName(department)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                              getStatus(department),
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                getStatus(department),
                              )}`}
                            />
                            {getStatus(department)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <FiCalendar size={14} />
                            {formatDate(
                              department.created_at ||
                                department.createdAt ||
                                department.created,
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <ActionButton
                              title="View"
                              onClick={() => openView(department)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <FiEye size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Edit"
                              onClick={() => openEdit(department)}
                              className="text-amber-600 hover:bg-amber-50"
                            >
                              <FiEdit2 size={16} />
                            </ActionButton>

                            {active ? (
                              <ActionButton
                                title="Deactivate"
                                onClick={() => deactivateDepartment(department)}
                                disabled={actionLoading}
                                className="text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                              >
                                <FiPower size={16} />
                              </ActionButton>
                            ) : (
                              <ActionButton
                                title="Activate"
                                onClick={() => activateDepartment(department)}
                                disabled={actionLoading}
                                className="text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                <FiCheckCircle size={16} />
                              </ActionButton>
                            )}

                            <ActionButton
                              title="Delete"
                              onClick={() => handleDelete(department)}
                              disabled={actionLoading}
                              className="text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              <FiTrash2 size={16} />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalDepartments > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page{" "}
                <span className="font-bold text-slate-800">{currentPage}</span>{" "}
                of{" "}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                  Previous
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;

                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, pages) => {
                      const previousPage = pages[index - 1];

                      return (
                        <React.Fragment key={page}>
                          {previousPage && page - previousPage > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold transition-all ${
                              currentPage === page
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <DepartmentModal
            form={form}
            editingId={editingId}
            saving={saving}
            branches={branches}
            onSubmit={handleSubmit}
            onClose={closeModal}
            onChange={handleInputChange}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  glowClass,
  barClass,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${glowClass}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconClass} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>

      <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full w-1/3 rounded-full bg-gradient-to-r ${barClass}`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  title,
  children,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${className}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   DEPARTMENT DETAILS
========================================================= */

function DepartmentDetails({
  department,
  onBack,
  onEdit,
  onActivate,
  onDeactivate,
  actionLoading,
}) {
  const status = getStatus(department);
  const active = status === "ACTIVE";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <FiArrowLeft size={17} />
            Back to Departments
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100"
            >
              <FiEdit2 size={16} />
              Edit
            </button>

            {active ? (
              <button
                type="button"
                onClick={onDeactivate}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-100 disabled:opacity-50"
              >
                <FiPower size={16} />
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={onActivate}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
              >
                <FiCheckCircle size={16} />
                Activate
              </button>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-6 text-white shadow-xl shadow-orange-500/20 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                <FiLayers size={30} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {department.name || "Department"}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                      active
                        ? "bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-200/30"
                        : "bg-white/15 text-white ring-1 ring-white/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-emerald-300" : "bg-white/70"
                      }`}
                    />

                    {status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/15">
                    <FiHash size={14} />
                    {department.code || "—"}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/15">
                    <FiMapPin size={14} />
                    {getBranchName(department)}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden rounded-2xl bg-white/10 p-5 backdrop-blur-sm ring-1 ring-white/15 lg:block">
              <FiActivity size={38} className="text-white/90" />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailInfoCard
            icon={<FiHash size={19} />}
            iconClass="bg-indigo-50 text-indigo-600"
            label="Department Code"
            value={department.code || "—"}
          />

          <DetailInfoCard
            icon={<FiMapPin size={19} />}
            iconClass="bg-blue-50 text-blue-600"
            label="Branch"
            value={getBranchName(department)}
          />

          <DetailInfoCard
            icon={<FiHome size={19} />}
            iconClass="bg-violet-50 text-violet-600"
            label="Hospital"
            value={getHospitalName(department)}
          />

          <DetailInfoCard
            icon={<FiCheckCircle size={19} />}
            iconClass={
              active
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }
            label="Current Status"
            value={status}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Description */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiFileText size={18} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">Description</h2>
                <p className="text-xs text-slate-400">Department overview</p>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm leading-7 text-slate-600">
                  {department.description?.trim()
                    ? department.description
                    : "No description has been added for this department."}
                </p>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FiActivity size={18} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">System Info</h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <InfoRow label="Department ID" value={department.id || "—"} />

              <InfoRow
                label="Created"
                value={formatDate(
                  department.created_at ||
                    department.createdAt ||
                    department.created,
                )}
              />

              <InfoRow
                label="Last Updated"
                value={formatDate(
                  department.updated_at ||
                    department.updatedAt ||
                    department.updated,
                )}
              />

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="text-sm font-medium text-slate-500">
                  Status
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                    status,
                  )}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                      status,
                    )}`}
                  />
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional information */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <FiAlertCircle size={19} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Department Management
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL INFO CARD
========================================================= */

function DetailInfoCard({ icon, iconClass, label, value }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-sm font-bold text-slate-800">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   DEPARTMENT MODAL
========================================================= */

function DepartmentModal({
  form,
  editingId,
  saving,
  branches,
  onSubmit,
  onClose,
  onChange,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                {editingId ? <FiEdit2 size={20} /> : <FiPlus size={21} />}
              </div>

              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {editingId ? "Edit Department" : "Create New Department"}
                </h2>

                <p className="mt-0.5 text-xs text-orange-50">
                  {editingId
                    ? "Update department information."
                    : "Add a new department to your hospital."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-50"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="max-h-[calc(92vh-86px)] overflow-y-auto"
        >
          <div className="space-y-5 p-6">
            {/* Branch */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Branch <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <FiMapPin
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  name="branch"
                  value={form.branch}
                  onChange={onChange}
                  required
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                >
                  <option value="">Select Branch</option>

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name ||
                        branch.branch_name ||
                        branch.title ||
                        `Branch ${branch.id}`}
                      {branch.hospital_name ? ` — ${branch.hospital_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name + Code */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Department Name <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <FiLayers
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    placeholder="e.g. Cardiology"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Department Code <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <FiHash
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={onChange}
                    required
                    placeholder="e.g. CARDIO"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm uppercase text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <div className="relative">
                <FiFileText
                  size={17}
                  className="absolute left-3.5 top-3.5 text-slate-400"
                />

                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={4}
                  placeholder="Enter department description..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <FiRefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  {editingId ? "Update Department" : "Create Department"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
