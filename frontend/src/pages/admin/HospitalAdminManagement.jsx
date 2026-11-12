import React, { useCallback, useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

import {
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiHome,
  FiUsers,
  FiActivity,
  FiX,
  FiPhone,
  FiUser,
  FiEye,
  FiSearch,
  FiFilter,
} from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";

import { authApi, hospitalApi, branchApi } from "../../api/service";

import HospitalAdminDetails from "./HospitalAdminDetails";

const INITIAL_FORM = {
  username: "",

  email: "",

  password: "",

  first_name: "",

  last_name: "",

  phone: "",

  hospital: "",

  branch: "",
};

const INITIAL_FILTERS = {
  hospital: "",

  email: "",

  approval: "",

  account: "",
};

const getList = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const getRelationId = (value) => {
  if (value && typeof value === "object") {
    return (
      value.id ??
      value.pk ??
      value.hospital_id ??
      value.branch_id ??
      value.value ??
      ""
    );
  }

  return value ?? "";
};

const getAdminHospitalId = (admin) =>
  getRelationId(admin?.hospital ?? admin?.hospital_id);

const getAdminBranchId = (admin) =>
  getRelationId(admin?.branch ?? admin?.branch_id);

const getBranchHospitalId = (branch) =>
  getRelationId(branch?.hospital ?? branch?.hospital_id);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      {children || null}
    </div>
  );
}

function StatusBadge({ value, yes, no }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {value ? <FiCheckCircle size={13} /> : <FiClock size={13} />}

      {value ? yes : no}
    </span>
  );
}

function Modal({
  title,

  subtitle,

  icon: Icon,

  onClose,

  children,

  size = "max-w-2xl",
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full ${size} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              {Icon ? <Icon size={20} /> : <FiUser size={20} />}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>

              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <FiX size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function TextField({
  label,

  value,

  onChange,

  type = "text",

  required = false,

  placeholder = "",
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function SelectField({
  label,

  value,

  onChange,

  children,

  required = false,

  disabled = false,
}) {
  return (
    <Field label={label}>
      <select
        value={value ?? ""}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {children}
      </select>
    </Field>
  );
}

export default function HospitalAdminManagement() {
  const [admins, setAdmins] = useState([]);

  const [hospitals, setHospitals] = useState([]);

  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  const [editingAdmin, setEditingAdmin] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [savingEdit, setSavingEdit] = useState(false);

  const [otpAdmin, setOtpAdmin] = useState(null);

  const [otp, setOtp] = useState("");

  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // View details inside the existing dashboard content area.

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [adminResponse, hospitalResponse, branchResponse] =
        await Promise.all([
          authApi.hospitalAdmins(),

          hospitalApi.list(),

          branchApi.list().catch(() => ({ data: [] })),
        ]);

      setAdmins(getList(adminResponse));

      setHospitals(getList(hospitalResponse));

      setBranches(getList(branchResponse));
    } catch (error) {
      console.error("Hospital Admin load error:", error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to load hospital administrators",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getHospital = useCallback(
    (admin) => {
      const relation = admin?.hospital;

      if (relation && typeof relation === "object") {
        return relation;
      }

      const hospitalId = getAdminHospitalId(admin);

      return (
        hospitals.find(
          (hospital) => String(hospital.id) === String(hospitalId),
        ) || null
      );
    },

    [hospitals],
  );

  const getHospitalName = useCallback(
    (admin) =>
      admin?.hospital_name ||
      (typeof admin?.hospital === "object" ? admin.hospital?.name : "") ||
      getHospital(admin)?.name ||
      getHospital(admin)?.hospital_name ||
      "Unassigned hospital",

    [getHospital],
  );

  const getBranch = useCallback(
    (admin) => {
      const relation = admin?.branch;

      if (relation && typeof relation === "object") {
        return relation;
      }

      const branchId = getAdminBranchId(admin);

      return (
        branches.find((branch) => String(branch.id) === String(branchId)) ||
        null
      );
    },

    [branches],
  );

  const getBranchName = useCallback(
    (admin) => {
      const relation = admin?.branch;
      const branch =
        relation && typeof relation === "object" ? relation : getBranch(admin);

      return admin?.branch_name || branch?.name || branch?.branch_name || "";
    },
    [getBranch],
  );

  const openAdminDetails = (admin) => {
    setSelectedAdmin(admin);

    setShowDetails(true);
  };

  const closeAdminDetails = () => {
    setShowDetails(false);

    setSelectedAdmin(null);
  };

  const currentSelectedAdmin = useMemo(() => {
    if (!selectedAdmin) return null;

    return (
      admins.find((admin) => String(admin.id) === String(selectedAdmin.id)) ||
      selectedAdmin
    );
  }, [admins, selectedAdmin]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const hospital = getHospital(admin);

      const branch = getBranch(admin);

      const fullName = `${admin.first_name || ""} ${admin.last_name || ""}`

        .trim()

        .toLowerCase();

      const searchableValues = [
        admin.username,

        admin.first_name,

        admin.last_name,

        fullName,

        admin.email,

        admin.phone,

        getHospitalName(admin),

        branch?.name,

        branch?.branch_name,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const selectedHospital = hospitals.find(
        (item) => String(item.id) === String(filters.hospital),
      );

      const adminHospitalId = getAdminHospitalId(admin);

      const matchesHospital =
        !filters.hospital ||
        String(adminHospitalId) === String(filters.hospital) ||
        (!adminHospitalId &&
          selectedHospital &&
          String(
            admin?.hospital_name ||
              (typeof admin?.hospital === "object"
                ? admin.hospital?.name
                : "") ||
              hospital?.name ||
              "",
          )
            .trim()
            .toLowerCase() ===
            String(selectedHospital.name || "")
              .trim()
              .toLowerCase());

      const matchesEmail =
        !filters.email ||
        (filters.email === "verified"
          ? Boolean(admin.is_email_verified)
          : !admin.is_email_verified);

      const matchesApproval =
        !filters.approval ||
        (filters.approval === "approved"
          ? Boolean(admin.is_approved)
          : !admin.is_approved);

      const matchesAccount =
        !filters.account ||
        (filters.account === "active"
          ? Boolean(admin.is_active)
          : !admin.is_active);

      return (
        matchesSearch &&
        matchesHospital &&
        matchesEmail &&
        matchesApproval &&
        matchesAccount
      );
    });
  }, [
    admins,

    hospitals,

    filters,

    search,

    getHospital,

    getHospitalName,

    getBranch,
  ]);

  const stats = useMemo(
    () => ({
      total: admins.length,

      pending: admins.filter((admin) => !admin.is_approved).length,

      verified: admins.filter((admin) => admin.is_email_verified).length,

      active: admins.filter((admin) => admin.is_active && admin.is_approved)
        .length,
    }),

    [admins],
  );

  const updateForm = (key, value) => {
    setForm((previous) => ({
      ...previous,

      [key]: value,

      ...(key === "hospital" ? { branch: "" } : {}),
    }));
  };

  const updateEditForm = (key, value) => {
    setEditForm((previous) => ({
      ...previous,

      [key]: value,

      ...(key === "hospital" ? { branch: "" } : {}),
    }));
  };

  const closeCreate = () => {
    setCreateOpen(false);

    setForm(INITIAL_FORM);
  };

  const create = async (event) => {
    event.preventDefault();

    const username = (form.username || "").trim();
    const email = (form.email || "").trim();
    const password = form.password || "";

    if (!username || !email || !password.trim()) {
      toast.error("Username, email and temporary password are required");
      return;
    }

    if (!form.hospital) {
      toast.error("Please select a hospital");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        username,
        email,
        first_name: (form.first_name || "").trim(),
        last_name: (form.last_name || "").trim(),
        phone: (form.phone || "").trim(),
        hospital: Number(form.hospital),
        branch: form.branch ? Number(form.branch) : null,
      };

      await authApi.hospitalAdminCreate(payload);
      toast.success("Hospital Admin created successfully");
      closeCreate();
      await load();
    } catch (error) {
      console.error("Create Hospital Admin error:", error);
      const data = error?.response?.data || {};
      const details = Object.entries(data)
        .map(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(", ")
            : String(value ?? "");
          return message ? `${key}: ${message}` : "";
        })
        .filter(Boolean)
        .join(" | ");

      toast.error(
        data.detail ||
          data.message ||
          data.error ||
          details ||
          "Failed to create Hospital Admin. Check the server response.",
      );
    } finally {
      setSaving(false);
    }
  };

  const editAdmin = (admin) => {
    setEditingAdmin(admin);

    setEditForm({
      username: admin.username || "",

      email: admin.email || "",

      first_name: admin.first_name || "",

      last_name: admin.last_name || "",

      phone: admin.phone || "",

      hospital: String(getAdminHospitalId(admin) || ""),

      branch: String(getAdminBranchId(admin) || ""),
    });
  };

  const saveAdminEdit = async (event) => {
    event.preventDefault();

    if (!editingAdmin) return;

    if (!editForm.username.trim() || !editForm.email.trim()) {
      toast.error("Username and email are required");

      return;
    }

    if (!editForm.hospital) {
      toast.error("Please select a hospital");

      return;
    }

    try {
      setSavingEdit(true);

      await authApi.hospitalAdminUpdate(editingAdmin.id, {
        ...editForm,

        username: editForm.username.trim(),

        email: editForm.email.trim(),

        hospital: Number(editForm.hospital),

        branch: editForm.branch ? Number(editForm.branch) : null,
      });

      toast.success("Hospital Admin updated successfully");

      setEditingAdmin(null);

      await load();
    } catch (error) {
      console.error(error);

      const data = error?.response?.data || {};

      toast.error(
        data.detail ||
          data.message ||
          Object.values(data).flat().join(" ") ||
          "Failed to update Hospital Admin",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const approve = async (id) => {
    try {
      await authApi.hospitalAdminApprove(id);

      toast.success("Hospital Admin approved");

      await load();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to approve admin",
      );
    }
  };

  const resend = async (id) => {
    try {
      await authApi.hospitalAdminResendOtp(id);

      toast.success("OTP resent successfully");
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to resend OTP",
      );
    }
  };

  const verifyAdminOtp = async (event) => {
    event.preventDefault();

    if (!otpAdmin) return;

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter a valid 6-digit OTP");

      return;
    }

    try {
      setVerifyingOtp(true);

      await authApi.hospitalAdminVerifyOtp({
        email: otpAdmin.email,

        otp,
      });

      toast.success("Email verified successfully");

      setOtpAdmin(null);

      setOtp("");

      await load();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Invalid or expired OTP",
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const toggleAdminStatus = async (admin) => {
    if (!admin.is_email_verified) {
      toast.error("Email must be verified first");

      return;
    }

    const action = admin.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(`Are you sure you want to ${action} ${admin.username}?`)
    ) {
      return;
    }

    try {
      await authApi.hospitalAdminSetStatus(admin.id, !admin.is_active);

      toast.success(
        `Admin ${admin.is_active ? "deactivated" : "activated"} successfully`,
      );

      await load();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to change admin status",
      );
    }
  };

  const deleteAdmin = async (admin) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${admin.username}?`,
      )
    ) {
      return;
    }

    try {
      await authApi.hospitalAdminDelete(admin.id);

      if (String(selectedAdmin?.id) === String(admin.id)) {
        closeAdminDetails();
      }

      toast.success("Hospital Admin deleted successfully");

      await load();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete admin",
      );
    }
  };

  const resetFilters = () => {
    setSearch("");

    setFilters(INITIAL_FILTERS);
  };

  const statCards = [
    {
      label: "Total Admins",

      value: stats.total,

      note: "All administrators",

      icon: FiUsers,

      color: "from-indigo-500 to-violet-600",
    },

    {
      label: "Pending Approval",

      value: stats.pending,

      note: "Awaiting approval",

      icon: FiClock,

      color: "from-amber-500 to-orange-600",
    },

    {
      label: "Email Verified",

      value: stats.verified,

      note: "Verified accounts",

      icon: FiShield,

      color: "from-emerald-500 to-teal-600",
    },

    {
      label: "Active Admins",

      value: stats.active,

      note: "Approved and active",

      icon: FiActivity,

      color: "from-rose-500 to-red-600",
    },
  ];

  if (showDetails && currentSelectedAdmin) {
    return (
      <HospitalAdminDetails
        admin={currentSelectedAdmin}
        hospitalName={getHospitalName(currentSelectedAdmin)}
        branch={getBranch(currentSelectedAdmin)}
        onBack={closeAdminDetails}
        onEdit={() => {
          const adminToEdit = currentSelectedAdmin;

          closeAdminDetails();

          editAdmin(adminToEdit);
        }}
        onStatusChange={() => toggleAdminStatus(currentSelectedAdmin)}
        onDelete={() => deleteAdmin(currentSelectedAdmin)}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Admin Management"
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-amber-600 hover:to-orange-700 sm:w-auto"
          >
            <FiPlus size={18} />
            Create Hospital Admin
          </button>
        }
      />

      {/* Dashboard statistics */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-slate-800">
                    {card.value}
                  </h3>

                  <p className="mt-3 text-xs text-slate-400">{card.note}</p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Management table */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <FiUsers size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Hospital Administrators
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Search and filters */}

        <div className="border-b border-slate-200 bg-slate-50/50 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <label className={labelClass}>Search</label>

              <div className="relative">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, username, email, phone, hospital..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <SelectField
              label="Hospital"
              value={filters.hospital}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,

                  hospital: value,
                }))
              }
            >
              <option value="">All Hospitals</option>

              {hospitals.map((hospital) => (
                <option key={hospital.id} value={String(hospital.id)}>
                  {hospital.name ||
                    hospital.hospital_name ||
                    `Hospital #${hospital.id}`}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Email Verification"
              value={filters.email}
              onChange={(value) =>
                setFilters((previous) => ({ ...previous, email: value }))
              }
            >
              <option value="">All Email Statuses</option>

              <option value="verified">Verified</option>

              <option value="unverified">Unverified</option>
            </SelectField>

            <SelectField
              label="Approval Status"
              value={filters.approval}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,

                  approval: value,
                }))
              }
            >
              <option value="">All Approval Statuses</option>

              <option value="approved">Approved</option>

              <option value="pending">Pending</option>
            </SelectField>

            <SelectField
              label="Account Status"
              value={filters.account}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,

                  account: value,
                }))
              }
            >
              <option value="">All Accounts</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </SelectField>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
              <FiRefreshCw size={15} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[64px]" />
              <col className="w-[240px]" />
              <col className="w-[260px]" />
              <col className="w-[180px]" />
              <col className="w-[240px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[115px]" />
              <col className="w-[300px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "S.No.",
                  "Administrator",
                  "Hospital",
                  "Branch",
                  "Email",
                  "Phone Number",
                  "Verification",
                  "Approval",
                  "Account / Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 ${heading === "Account / Actions" ? "text-right" : "text-left"}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && admins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <FiRefreshCw
                      size={24}
                      className="mx-auto animate-spin text-amber-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading administrators...
                    </p>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <FiUsers size={30} className="mx-auto text-slate-300" />
                    <h3 className="mt-3 font-bold text-slate-700">
                      {admins.length === 0
                        ? "No Hospital Admins Found"
                        : "No Matching Administrators"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {admins.length === 0
                        ? "Create your first Hospital Admin to get started."
                        : "Try another search term or reset your filters."}
                    </p>
                    {admins.length > 0 ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                      >
                        Clear Search and Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        <FiPlus className="mr-2 inline" /> Create Admin
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin, index) => (
                  <tr
                    key={admin.id}
                    className="transition-colors hover:bg-amber-50/30"
                  >
                    <td className="px-3 py-4 align-middle text-sm font-semibold text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 font-bold text-white">
                          {admin.profile_image ? (
                            <img
                              src={admin.profile_image}
                              alt={`${admin.username || "Admin"} profile`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (
                              admin.first_name?.[0] ||
                              admin.username?.[0] ||
                              "A"
                            ).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="whitespace-normal break-words text-sm font-bold leading-5 text-slate-800">
                            {`${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
                              admin.username}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            @{admin.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex min-w-0 items-start gap-2 text-sm text-slate-700">
                        <FiHome className="mt-0.5 shrink-0 text-orange-500" />
                        <span className="whitespace-normal break-words font-medium leading-5">
                          {getHospitalName(admin)}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-middle">
                      {getBranchName(admin) ? (
                        <span className="block whitespace-normal break-words rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold leading-5 text-indigo-700">
                          {getBranchName(admin)}
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500">
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 align-middle">
                      <div className="flex min-w-0 items-start gap-2 text-sm text-slate-600">
                        <FiMail className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="whitespace-normal break-all leading-5">
                          {admin.email || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <FiPhone className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="whitespace-normal break-words">
                          {admin.phone || admin.phone_number || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-middle">
                      <StatusBadge
                        value={Boolean(admin.is_email_verified)}
                        yes="Verified"
                        no="Unverified"
                      />
                    </td>

                    <td className="px-3 py-4 align-middle">
                      <StatusBadge
                        value={Boolean(admin.is_approved)}
                        yes="Approved"
                        no="Pending"
                      />
                    </td>

                    <td className="px-3 py-4 align-middle">
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${admin.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {!admin.is_email_verified && (
                            <>
                              <button
                                type="button"
                                title="Verify email OTP"
                                onClick={() => {
                                  setOtpAdmin(admin);
                                  setOtp("");
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <FiShield size={13} /> Verify
                              </button>
                              <button
                                type="button"
                                title="Resend OTP"
                                onClick={() => resend(admin.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                              >
                                <FiRefreshCw size={14} />
                              </button>
                            </>
                          )}
                          {admin.is_email_verified && !admin.is_approved && (
                            <button
                              type="button"
                              title="Approve admin"
                              onClick={() => approve(admin.id)}
                              className="flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <FiUserCheck size={13} /> Approve
                            </button>
                          )}
                          <button
                            type="button"
                            title="View complete details"
                            aria-label={`View details for ${admin.username}`}
                            onClick={() => openAdminDetails(admin)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit admin"
                            onClick={() => editAdmin(admin)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            type="button"
                            title={admin.is_active ? "Deactivate" : "Activate"}
                            onClick={() => toggleAdminStatus(admin)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${admin.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                          >
                            {admin.is_active ? (
                              <FiUserX size={14} />
                            ) : (
                              <FiUserCheck size={14} />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Delete admin"
                            onClick={() => deleteAdmin(admin)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredAdmins.length}
            </span>{" "}
            matching administrator
            {filteredAdmins.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* Create modal */}

      {createOpen && (
        <Modal
          title="Create Hospital Admin"
          subtitle="Add a new administrator account"
          icon={FiUser}
          onClose={closeCreate}
        >
          <form onSubmit={create} className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                label="Username"
                value={form.username}
                onChange={(value) => updateForm("username", value)}
                required
                placeholder="Enter username"
              />

              <TextField
                label="Email"
                value={form.email}
                onChange={(value) => updateForm("email", value)}
                type="email"
                required
                placeholder="admin@example.com"
              />

              <TextField
                label="First name"
                value={form.first_name}
                onChange={(value) => updateForm("first_name", value)}
              />

              <TextField
                label="Last name"
                value={form.last_name}
                onChange={(value) => updateForm("last_name", value)}
              />

              <TextField
                label="Phone"
                value={form.phone}
                onChange={(value) => updateForm("phone", value)}
                type="tel"
              />

              <TextField
                label="Temporary password"
                value={form.password}
                onChange={(value) => updateForm("password", value)}
                type="password"
                required
              />

              <div className="sm:col-span-2">
                <SelectField
                  label="Hospital"
                  value={form.hospital}
                  required
                  onChange={(value) => updateForm("hospital", value)}
                >
                  <option value="">Select Hospital</option>

                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={String(hospital.id)}>
                      {hospital.name ||
                        hospital.hospital_name ||
                        `Hospital #${hospital.id}`}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="sm:col-span-2">
                <SelectField
                  label="Branch (optional)"
                  value={form.branch}
                  onChange={(value) => updateForm("branch", value)}
                  disabled={!form.hospital}
                >
                  <option value="">
                    {!form.hospital
                      ? "Select a hospital first"
                      : "No branch assigned"}
                  </option>

                  {branches

                    .filter(
                      (branch) =>
                        String(getBranchHospitalId(branch)) ===
                        String(form.hospital),
                    )

                    .map((branch) => (
                      <option key={branch.id} value={String(branch.id)}>
                        {branch.name ||
                          branch.branch_name ||
                          `Branch #${branch.id}`}
                      </option>
                    ))}
                </SelectField>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <FiRefreshCw className="animate-spin" /> : <FiPlus />}

                {saving ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}

      {editingAdmin && (
        <Modal
          title="Edit Hospital Admin"
          subtitle="Update administrator details and assignment"
          icon={FiEdit}
          onClose={() => setEditingAdmin(null)}
          size="max-w-3xl"
        >
          <form onSubmit={saveAdminEdit} className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                ["username", "Username", "text"],

                ["email", "Email address", "email"],

                ["first_name", "First name", "text"],

                ["last_name", "Last name", "text"],

                ["phone", "Phone number", "tel"],
              ].map(([key, label, type]) => (
                <TextField
                  key={key}
                  label={label}
                  type={type}
                  value={editForm[key]}
                  onChange={(value) => updateEditForm(key, value)}
                  required={key === "username" || key === "email"}
                />
              ))}

              <SelectField
                label="Hospital"
                value={editForm.hospital}
                required
                onChange={(value) => updateEditForm("hospital", value)}
              >
                <option value="">Select Hospital</option>

                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={String(hospital.id)}>
                    {hospital.name ||
                      hospital.hospital_name ||
                      `Hospital #${hospital.id}`}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Branch (optional)"
                value={editForm.branch}
                onChange={(value) => updateEditForm("branch", value)}
                disabled={!editForm.hospital}
              >
                <option value="">
                  {!editForm.hospital
                    ? "Select a hospital first"
                    : "No branch assigned"}
                </option>

                {branches

                  .filter(
                    (branch) =>
                      String(getBranchHospitalId(branch)) ===
                      String(editForm.hospital),
                  )

                  .map((branch) => (
                    <option key={branch.id} value={String(branch.id)}>
                      {branch.name ||
                        branch.branch_name ||
                        `Branch #${branch.id}`}
                    </option>
                  ))}
              </SelectField>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingEdit ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}

                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* OTP verification modal */}

      {otpAdmin && (
        <Modal
          title="Verify Email"
          subtitle="Enter the OTP sent to the administrator"
          icon={FiShield}
          onClose={() => {
            setOtpAdmin(null);

            setOtp("");
          }}
          size="max-w-md"
        >
          <form onSubmit={verifyAdminOtp} className="space-y-5 p-6">
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-xs text-slate-500">OTP sent to</p>

              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {otpAdmin.email}
              </p>
            </div>

            <Field label="Enter 6-digit OTP">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
                className={`${inputClass} py-4 text-center text-2xl font-bold tracking-[0.5em]`}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOtpAdmin(null);

                  setOtp("");
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {verifyingOtp ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}

                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => resend(otpAdmin.id)}
              className="w-full text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Resend OTP
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
