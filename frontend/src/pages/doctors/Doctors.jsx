import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiX,
  FiSave,
  FiUploadCloud,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiUsers,
  FiActivity,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiUser,
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiPhone,
  FiMail,
  FiAward,
  FiCalendar,
  FiDollarSign,
  FiShield,
  FiLock,
  FiImage,
} from "react-icons/fi";

import {
  doctorApi,
  staffApi,
  hospitalApi,
  branchApi,
  departmentApi,
} from "../../api/service";

/* =========================================================
   CONSTANTS
========================================================= */

const SUPER_ROLES = ["SUPER_USER", "SUPER_ADMIN"];
const ADMIN_ROLES = [...SUPER_ROLES, "HOSPITAL_ADMIN"];
const PAGE_SIZE = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* =========================================================
   HELPERS
========================================================= */

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

function rows(response) {
  const value = unwrap(response);

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

function getError(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  if (data && typeof data === "object") {
    const key = Object.keys(data)[0];
    const value = data[key];

    if (Array.isArray(value)) {
      return `${key.replaceAll("_", " ")}: ${value[0]}`;
    }

    if (typeof value === "string") {
      return `${key.replaceAll("_", " ")}: ${value}`;
    }

    if (value && typeof value === "object") {
      return `${key.replaceAll("_", " ")}: ${JSON.stringify(value)}`;
    }
  }

  return error?.message || "Something went wrong. Please try again.";
}

function readStoredUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("user") || "{}");
    return raw?.data ?? raw?.user ?? raw;
  } catch {
    return {};
  }
}

function idOf(value) {
  if (value && typeof value === "object") {
    return value.id ?? "";
  }

  return value ?? "";
}

function optionRelation(item, key) {
  return idOf(item?.[`${key}_id`] ?? item?.[key]);
}

function fullName(item) {
  return (
    item?.full_name ||
    item?.name ||
    [item?.first_name, item?.last_name].filter(Boolean).join(" ") ||
    item?.username ||
    "Doctor"
  );
}

function inputClass(extra = "") {
  return `mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${extra}`;
}

/* =========================================================
   BUTTON
========================================================= */

function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "secondary",
  className = "",
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-200/60 hover:from-amber-600 hover:to-orange-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50",
    danger: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   NOTICE
========================================================= */

function Notice({ type = "error", children, onClose }) {
  if (!children) return null;

  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {success ? (
        <FiCheckCircle className="mt-0.5 shrink-0" size={17} />
      ) : (
        <FiAlertCircle className="mt-0.5 shrink-0" size={17} />
      )}

      <span className="min-w-0 flex-1">{children}</span>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="rounded p-0.5 font-bold"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  hint,
  ...props
}) {
  return (
    <label className="block min-w-0 text-sm font-bold text-slate-700">
      <span>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
        className={inputClass()}
      />

      {hint && (
        <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
  required = false,
  disabled = false,
  hint,
}) {
  return (
    <label className="block min-w-0 text-sm font-bold text-slate-700">
      <span>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <div className="relative mt-1.5">
        <FiLock
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          name={name}
          type={visible ? "text" : "password"}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          className={inputClass("pl-10 pr-12")}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
        >
          {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>

      {hint && (
        <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <label className="block min-w-0 text-sm font-bold text-slate-700">
      <span>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={inputClass()}
      >
        <option value="">
          {placeholder || `Select ${label.toLowerCase()}`}
        </option>

        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name || item.title || `#${item.id}`}
          </option>
        ))}
      </select>
    </label>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  description,
  icon: Icon,
  children,
  columns = "lg:grid-cols-3",
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-orange-50/80 px-4 py-4 sm:px-5">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700">
            <Icon size={19} />
          </span>
        )}

        <div className="min-w-0">
          <h3 className="font-extrabold text-slate-900">{title}</h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 ${columns}`}
      >
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DOCUMENT UPLOAD
========================================================= */

function DocumentUpload({
  label,
  name,
  currentUrl,
  onChange,
  disabled = false,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-3 text-orange-700">
          <FiFileText size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{label}</p>

          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-all text-xs font-semibold text-orange-700 underline"
            >
              View current document
            </a>
          )}

          {!disabled && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-700">
              <FiUploadCloud size={15} />
              Choose document
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(event) =>
                  onChange(name, event.target.files?.[0] || null)
                }
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ label, value, icon: Icon, theme, description }) {
  const themes = {
    orange: {
      card: "border-orange-200/80 from-white to-orange-50/80",
      icon: "bg-gradient-to-br from-amber-400 to-orange-600 text-white",
      accent: "text-orange-700",
      top: "bg-gradient-to-r from-amber-400 to-orange-600",
    },
    green: {
      card: "border-emerald-200/80 from-white to-emerald-50/80",
      icon: "bg-gradient-to-br from-emerald-400 to-green-600 text-white",
      accent: "text-emerald-700",
      top: "bg-gradient-to-r from-emerald-400 to-green-600",
    },
    slate: {
      card: "border-slate-200 from-white to-slate-100/80",
      icon: "bg-gradient-to-br from-slate-500 to-slate-700 text-white",
      accent: "text-slate-700",
      top: "bg-gradient-to-r from-slate-400 to-slate-600",
    },
    amber: {
      card: "border-amber-200/80 from-white to-amber-50/80",
      icon: "bg-gradient-to-br from-yellow-400 to-amber-600 text-white",
      accent: "text-amber-700",
      top: "bg-gradient-to-r from-yellow-400 to-amber-600",
    },
  };

  const style = themes[theme] || themes.orange;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${style.top}`} />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-extrabold ${style.accent}`}>
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>

        <span className={`rounded-2xl p-3 shadow-sm ${style.icon}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-orange-100 hover:bg-orange-50/40">
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon size={15} className="text-orange-600" />}
        <p className="text-xs font-semibold">{label}</p>
      </div>

      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Doctors() {
  const currentUser = useMemo(readStoredUser, []);
  const role = String(currentUser.role || "").toUpperCase();

  const isSuperUser =
    SUPER_ROLES.includes(role) || currentUser.is_superuser === true;

  const canManage =
    ADMIN_ROLES.includes(role) || currentUser.is_superuser === true;

  const assignedHospital = String(
    idOf(currentUser.hospital_id ?? currentUser.hospital) || "",
  );

  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState(assignedHospital);
  const [branchFilter, setBranchFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const emptyAccountForm = () => ({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    phone: "",
    hospital: isSuperUser ? "" : assignedHospital,
    branch: "",
    department: "",
    profile_image: null,
  });

  const emptyProfileForm = () => ({
    specialization: "",
    qualification: "",
    registration_number: "",
    experience_years: "0",
    consultation_fee: "0",
    bio: "",
    available_from: "",
    available_to: "",
    is_available: true,
    degree_certificate: null,
    experience_letter: null,
    identity_document: null,
  });

  const [modal, setModal] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [profileForm, setProfileForm] = useState(emptyProfileForm());
  const [accountImagePreview, setAccountImagePreview] = useState("");
  const [documentFiles, setDocumentFiles] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* -------------------- Lookups -------------------- */

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);

    try {
      const [hospitalResponse, branchResponse, departmentResponse] =
        await Promise.all([
          isSuperUser ? hospitalApi.list() : Promise.resolve(null),
          branchApi.list(),
          departmentApi.list(),
        ]);

      if (hospitalResponse) setHospitals(rows(hospitalResponse));

      setBranches(rows(branchResponse));
      setDepartments(rows(departmentResponse));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLookupsLoading(false);
    }
  }, [isSuperUser]);

  /* -------------------- Doctor list -------------------- */

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) params.search = search.trim();
      if (branchFilter) params.branch = branchFilter;

      const response = await doctorApi.list(params);

      setDoctors(rows(response));
      setPage(1);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [search, branchFilter]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  /* -------------------- Dependent options -------------------- */

  const accountBranches = useMemo(
    () =>
      branches.filter((branch) => {
        const branchHospital = String(optionRelation(branch, "hospital"));
        const hospital = accountForm.hospital || assignedHospital;

        return hospital ? branchHospital === String(hospital) : false;
      }),
    [branches, accountForm.hospital, assignedHospital],
  );

  const accountDepartments = useMemo(
    () =>
      departments.filter(
        (department) =>
          String(optionRelation(department, "branch")) ===
          String(accountForm.branch),
      ),
    [departments, accountForm.branch],
  );

  const filterBranches = useMemo(
    () =>
      branches.filter((branch) => {
        const hospital = hospitalFilter || assignedHospital;

        return hospital
          ? String(optionRelation(branch, "hospital")) === String(hospital)
          : true;
      }),
    [branches, hospitalFilter, assignedHospital],
  );

  const filterDepartments = useMemo(
    () =>
      departments.filter((department) => {
        if (!branchFilter) {
          if (hospitalFilter || assignedHospital) {
            const hospitalBranches = new Set(
              filterBranches.map((branch) => String(branch.id)),
            );

            return hospitalBranches.has(
              String(optionRelation(department, "branch")),
            );
          }

          return true;
        }

        return (
          String(optionRelation(department, "branch")) === String(branchFilter)
        );
      }),
    [
      departments,
      branchFilter,
      filterBranches,
      hospitalFilter,
      assignedHospital,
    ],
  );

  function updateAccount(event) {
    const { name, value } = event.target;

    setAccountForm((previous) => ({
      ...previous,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
      ...(name === "hospital" ? { branch: "", department: "" } : {}),
      ...(name === "branch" ? { department: "" } : {}),
    }));
  }

  function updateProfile(event) {
    const { name, value, type, checked } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetModal() {
    setModal(null);
    setSelectedDoctor(null);
    setAccountForm(emptyAccountForm());
    setProfileForm(emptyProfileForm());
    setAccountImagePreview("");
    setDocumentFiles({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
  }

  function openCreate() {
    setError("");
    setSuccess("");
    setSelectedDoctor(null);
    setAccountForm(emptyAccountForm());
    setProfileForm(emptyProfileForm());
    setAccountImagePreview("");
    setDocumentFiles({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setModal("create");
  }

  function openView(doctor) {
    setError("");
    setSuccess("");
    setSelectedDoctor(doctor);

    setProfileForm({
      specialization: doctor.specialization || "",
      qualification: doctor.qualification || "",
      registration_number: doctor.registration_number || "",
      experience_years: String(doctor.experience_years ?? 0),
      consultation_fee: String(doctor.consultation_fee ?? 0),
      bio: doctor.bio || "",
      available_from: doctor.available_from || "",
      available_to: doctor.available_to || "",
      is_available: doctor.is_available !== false,
      degree_certificate: null,
      experience_letter: null,
      identity_document: null,
    });

    setDocumentFiles({});
    setModal("view");
  }

  async function openEdit(doctor) {
    setError("");
    setSuccess("");
    setModalLoading(true);
    setModal("edit");
    setSelectedDoctor(doctor);
    setDocumentFiles({});

    try {
      const response = await doctorApi.get(doctor.id);
      const data = unwrap(response);
      const profile = data?.data ?? data;

      setSelectedDoctor(profile);

      setProfileForm({
        specialization: profile.specialization || "",
        qualification: profile.qualification || "",
        registration_number: profile.registration_number || "",
        experience_years: String(profile.experience_years ?? 0),
        consultation_fee: String(profile.consultation_fee ?? 0),
        bio: profile.bio || "",
        available_from: profile.available_from || "",
        available_to: profile.available_to || "",
        is_available: profile.is_available !== false,
        degree_certificate: null,
        experience_letter: null,
        identity_document: null,
      });

      setAccountForm((previous) => ({
        ...previous,
        username: profile.username || "",
        email: profile.email || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: String(profile.phone || "")
          .replace(/\D/g, "")
          .slice(0, 10),
        hospital: String(profile.hospital_id || assignedHospital),
        branch: String(profile.branch_id || ""),
        department: String(profile.department_id || ""),
        profile_image: null,
      }));

      setAccountImagePreview(profile.profile_image || "");
    } catch (err) {
      setError(getError(err));
    } finally {
      setModalLoading(false);
    }
  }

  /* -------------------- Create doctor account -------------------- */

  async function createDoctor(event) {
    event.preventDefault();

    if (!canManage || busy) return;

    if (accountForm.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (accountForm.password !== accountForm.confirm_password) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (accountForm.phone && accountForm.phone.length !== 10) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!accountForm.branch) {
      setError("Please select a branch.");
      return;
    }

    if (isSuperUser && !accountForm.hospital) {
      setError("Please select a hospital first.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();

      const fields = {
        username: accountForm.username.trim(),
        email: accountForm.email.trim().toLowerCase(),
        password: accountForm.password,
        confirm_password: accountForm.confirm_password,
        first_name: accountForm.first_name.trim(),
        last_name: accountForm.last_name.trim(),
        phone: accountForm.phone.trim(),
        role: "DOCTOR",
        branch: accountForm.branch,
        department: accountForm.department || "",
      };

      if (isSuperUser) fields.hospital = accountForm.hospital;

      if (accountForm.profile_image) {
        payload.append("profile_image", accountForm.profile_image);
      }

      Object.entries(fields).forEach(([key, value]) => {
        payload.append(key, value);
      });

      const createdResponse = await staffApi.create(payload);
      const created = unwrap(createdResponse);
      const user = created?.data ?? created;
      const userId = user?.id ?? user?.user?.id ?? user?.user_id;

      if (!userId) {
        throw new Error(
          "Staff account was created, but the response did not contain a user ID.",
        );
      }

      const profileResponse = await doctorApi.list({ user_id: userId });
      const profileRows = rows(profileResponse);

      const profile = profileRows.find(
        (item) => Number(item.user_id) === Number(userId),
      );

      await loadDoctors();

      if (!profile?.id) {
        setModal(null);
        setSuccess(
          "Doctor account created. The professional profile was not returned by /doctors/ yet. Refresh and check your DoctorProfile signal.",
        );
        return;
      }

      setSelectedDoctor(profile);

      setProfileForm({
        specialization: profile.specialization || "",
        qualification: profile.qualification || "",
        registration_number: profile.registration_number || "",
        experience_years: String(profile.experience_years ?? 0),
        consultation_fee: String(profile.consultation_fee ?? 0),
        bio: profile.bio || "",
        available_from: profile.available_from || "",
        available_to: profile.available_to || "",
        is_available: profile.is_available !== false,
        degree_certificate: null,
        experience_letter: null,
        identity_document: null,
      });

      setAccountImagePreview(profile.profile_image || "");
      setDocumentFiles({});
      setModal("");

      setSuccess(
        "Doctor account created. Complete the professional registration below.",
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  /* -------------------- Save doctor profile -------------------- */

  async function saveDoctor(event) {
    event.preventDefault();

    if (!selectedDoctor || busy) return;

    if (accountForm.phone && accountForm.phone.length !== 10) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const profilePayload = new FormData();

      [
        "specialization",
        "qualification",
        "registration_number",
        "experience_years",
        "consultation_fee",
        "bio",
        "available_from",
        "available_to",
        "is_available",
      ].forEach((key) => {
        const value = profileForm[key];

        profilePayload.append(
          key,
          value === null || value === undefined ? "" : String(value),
        );
      });

      ["degree_certificate", "experience_letter", "identity_document"].forEach(
        (key) => {
          if (documentFiles[key]) {
            profilePayload.append(key, documentFiles[key]);
          }
        },
      );

      await doctorApi.update(selectedDoctor.id, profilePayload);

      const staffPayload = new FormData();

      const staffFields = {
        first_name: accountForm.first_name,
        last_name: accountForm.last_name,
        phone: accountForm.phone,
        branch: accountForm.branch,
        department: accountForm.department,
      };

      if (isSuperUser && accountForm.hospital) {
        staffFields.hospital = accountForm.hospital;
      }

      Object.entries(staffFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          staffPayload.append(key, value);
        }
      });

      if (accountForm.profile_image) {
        staffPayload.append("profile_image", accountForm.profile_image);
      }

      if (
        accountForm.first_name ||
        accountForm.last_name ||
        accountForm.phone ||
        accountForm.branch ||
        accountForm.department ||
        accountForm.profile_image
      ) {
        await staffApi.update(selectedDoctor.user_id, staffPayload);
      }

      const refreshed = await doctorApi.get(selectedDoctor.id);
      const freshDoctor = unwrap(refreshed);

      setSelectedDoctor(freshDoctor?.data ?? freshDoctor);

      await loadDoctors();

      setSuccess(
        "Doctor profile and professional registration updated successfully.",
      );

      setModal("view");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  /* -------------------- Status and delete -------------------- */

  async function toggleStatus(doctor) {
    if (!isSuperUser || busy) return;

    const nextActive = doctor.is_active === false;
    const name = fullName(doctor);

    if (!window.confirm(`${nextActive ? "Activate" : "Deactivate"} ${name}?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await staffApi.setStatus(doctor.user_id, nextActive);

      setSuccess(
        `${name} ${nextActive ? "activated" : "deactivated"} successfully.`,
      );

      await loadDoctors();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoctor(doctor) {
    if (!canManage || busy) return;

    const name = fullName(doctor);

    if (
      !window.confirm(
        `Permanently delete ${name} and their login account? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await staffApi.remove(doctor.user_id);

      setSuccess(`${name} and their account were deleted successfully.`);

      if (selectedDoctor?.id === doctor.id) {
        resetModal();
      }

      await loadDoctors();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  /* -------------------- Filters and pagination -------------------- */

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        if (
          hospitalFilter &&
          String(doctor.hospital_id) !== String(hospitalFilter)
        ) {
          return false;
        }

        if (branchFilter && String(doctor.branch_id) !== String(branchFilter)) {
          return false;
        }

        if (
          departmentFilter &&
          String(doctor.department_id) !== String(departmentFilter)
        ) {
          return false;
        }

        if (statusFilter === "ACTIVE" && doctor.is_active === false) {
          return false;
        }

        if (statusFilter === "INACTIVE" && doctor.is_active !== false) {
          return false;
        }

        return true;
      }),
    [doctors, hospitalFilter, branchFilter, departmentFilter, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));

  const pageDoctors = filteredDoctors.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateHospitalFilter(value) {
    setHospitalFilter(value);
    setBranchFilter("");
    setDepartmentFilter("");
    setPage(1);
  }

  function updateBranchFilter(value) {
    setBranchFilter(value);
    setDepartmentFilter("");
    setPage(1);
  }

  const activeCount = doctors.filter((item) => item.is_active !== false).length;

  const inactiveCount = doctors.length - activeCount;

  const pendingCount = doctors.filter(
    (item) => item.registration_status !== "COMPLETED",
  ).length;

  const isReadOnly = modal === "view";

  const modalDoctorName = selectedDoctor
    ? fullName(selectedDoctor)
    : "New Doctor";

  const isFullPage = modal === "view" || modal === "edit";

  /* -------------------- Image upload validation -------------------- */

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Profile image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");

    setAccountForm((previous) => ({
      ...previous,
      profile_image: file,
    }));

    setAccountImagePreview(URL.createObjectURL(file));
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="min-h-full space-y-6 bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Doctors Management
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              loadLookups();
              loadDoctors();
            }}
            disabled={loading || busy}
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          {canManage && (
            <Button variant="primary" onClick={openCreate}>
              <FiPlus />
              Add Doctor
            </Button>
          )}
        </div>
      </header>

      <Notice type="error" onClose={() => setError("")}>
        {error}
      </Notice>

      <Notice type="success" onClose={() => setSuccess("")}>
        {success}
      </Notice>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Doctors"
          value={doctors.length}
          icon={FiUsers}
          theme="orange"
        />

        <StatCard
          label="Active Accounts"
          value={activeCount}
          icon={FiUserCheck}
          theme="green"
        />

        <StatCard
          label="Inactive Accounts"
          value={inactiveCount}
          icon={FiUserX}
          theme="slate"
        />

        <StatCard
          label="Registration Pending"
          value={pendingCount}
          icon={FiClock}
          theme="amber"
        />
      </div>

      {/* SEARCH AND FILTERS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-2 text-orange-700">
            <FiFilter size={18} />
          </span>

          <div>
            <h2 className="font-extrabold text-slate-900">Search & Filters</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search doctors..."
              className={`${inputClass()} pl-9`}
            />
          </div>

          {isSuperUser && (
            <SelectField
              label="Hospital"
              value={hospitalFilter}
              name="hospitalFilter"
              onChange={(event) => updateHospitalFilter(event.target.value)}
              options={hospitals}
              placeholder="All hospitals"
            />
          )}

          <SelectField
            label="Branch"
            value={branchFilter}
            name="branchFilter"
            onChange={(event) => updateBranchFilter(event.target.value)}
            options={filterBranches}
            placeholder="All branches"
          />

          <SelectField
            label="Department"
            value={departmentFilter}
            name="departmentFilter"
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setPage(1);
            }}
            options={filterDepartments}
            placeholder="All departments"
          />

          <label className="block text-sm font-bold text-slate-700">
            Account Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass()}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>

        {lookupsLoading && (
          <p className="mt-3 text-xs text-slate-500">
            Loading hospital, branch and department filters…
          </p>
        )}
      </section>

      {/* DOCTOR DIRECTORY */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-extrabold text-slate-900">Doctor Directory</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredDoctors.length} matching records
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            <FiActivity />
            Live directory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Doctor</th>
                <th className="px-5 py-4">Hospital</th>
                <th className="px-5 py-4">Branch / Department</th>
                <th className="px-5 py-4">Specialization</th>
                <th className="px-5 py-4">Experience</th>
                <th className="px-5 py-4">Registration</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <FiRefreshCw className="mr-2 inline animate-spin text-orange-600" />
                    Loading doctors…
                  </td>
                </tr>
              ) : pageDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <FiUsers className="mx-auto mb-2 text-2xl text-slate-300" />
                    No doctors match the selected filters.
                  </td>
                </tr>
              ) : (
                pageDoctors.map((doctor) => {
                  const active = doctor.is_active !== false;
                  const complete = doctor.registration_status === "COMPLETED";

                  return (
                    <tr
                      key={doctor.id}
                      className="transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {doctor.profile_image ? (
                            <img
                              src={doctor.profile_image}
                              alt=""
                              className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 font-extrabold text-orange-700">
                              <FiUser size={20} />
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {fullName(doctor)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {doctor.username ? `@${doctor.username} · ` : ""}
                              {doctor.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {doctor.hospital_name || doctor.hospital_id || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {doctor.branch_name || doctor.branch_id || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {doctor.department_name ||
                            doctor.department_id ||
                            "No department"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {doctor.specialization || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {doctor.experience_years ?? 0} yrs
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            complete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {complete ? "Complete" : "Pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="View doctor"
                            onClick={() => openView(doctor)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <FiEye />
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              title="Edit doctor"
                              onClick={() => openEdit(doctor)}
                              className="rounded-lg border border-orange-100 p-2 text-orange-700 transition hover:bg-orange-50"
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          {isSuperUser && (
                            <button
                              type="button"
                              title={active ? "Deactivate" : "Activate"}
                              onClick={() => toggleStatus(doctor)}
                              disabled={busy}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-orange-50"
                            >
                              {active ? <FiUserX /> : <FiUserCheck />}
                            </button>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              title="Delete doctor and account"
                              onClick={() => deleteDoctor(doctor)}
                              disabled={busy}
                              className="rounded-lg border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {filteredDoctors.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(page * PAGE_SIZE, filteredDoctors.length)} of{" "}
            {filteredDoctors.length}
          </p>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <FiChevronLeft />
              Previous
            </Button>

            <span className="min-w-20 text-center text-xs font-bold text-slate-600">
              Page {page} / {totalPages}
            </span>

            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <FiChevronRight />
            </Button>
          </div>
        </div>
      </section>

      {/* CREATE / VIEW / EDIT */}

      {modal && (
        <div
          className={
            isFullPage
              ? "fixed inset-0 z-[100] overflow-y-auto bg-slate-50 md:pl-[270px]"
              : "fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-3 pb-8 pt-20 backdrop-blur-sm sm:px-5 sm:pt-24 md:pl-[270px]"
          }
          onMouseDown={(event) => {
            if (!isFullPage && event.target === event.currentTarget && !busy) {
              resetModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-modal-title"
            className={
              isFullPage
                ? "min-h-screen w-full overflow-hidden bg-slate-50"
                : "mb-6 mt-0 w-full max-w-5xl shrink-0 overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
            }
          >
            {/* HEADER */}

            <div className="relative mt-5 overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-700 px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-amber-200/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {isFullPage && (
                    <button
                      type="button"
                      onClick={resetModal}
                      disabled={busy}
                      className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                      <FiArrowLeft />
                      Back to Doctors
                    </button>
                  )}

                  <h2
                    id="doctor-modal-title"
                    className="mt-1 text-xl font-extrabold sm:text-2xl"
                  >
                    {modal === "create"
                      ? "Create Doctor Account"
                      : modal === "edit"
                        ? "Edit Doctor Profile"
                        : "Doctor Profile"}
                  </h2>

                  <p className="mt-1 text-sm text-orange-50">
                    {modal === "create"
                      ? "Create the login account for doctor."
                      : modalDoctorName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetModal}
                  disabled={busy}
                  aria-label="Close"
                  className="rounded-xl border border-white/30 bg-white/10 p-2 transition hover:bg-white/20 disabled:opacity-50"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div
              className={
                isFullPage
                  ? "mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-6 lg:p-8"
                  : "max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-3 sm:p-6"
              }
            >
              <Notice type="error" onClose={() => setError("")}>
                {error}
              </Notice>

              <Notice type="success" onClose={() => setSuccess("")}>
                {success}
              </Notice>

              {modalLoading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-600">
                  <FiRefreshCw className="animate-spin text-orange-600" />
                  Loading doctor details…
                </div>
              ) : (
                <>
                  {/* DOCTOR SUMMARY */}

                  {modal !== "create" && selectedDoctor && (
                    <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
                      <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700" />

                      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="shrink-0">
                          {selectedDoctor.profile_image ? (
                            <img
                              src={selectedDoctor.profile_image}
                              alt="Doctor"
                              className="h-24 w-24 rounded-2xl border border-orange-100 object-cover shadow-sm sm:h-28 sm:w-28"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-3xl font-extrabold text-orange-700 sm:h-28 sm:w-28">
                              {fullName(selectedDoctor).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                              {fullName(selectedDoctor)}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                selectedDoctor.is_active === false
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {selectedDoctor.is_active === false
                                ? "Inactive Account"
                                : "Active Account"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {selectedDoctor.specialization ||
                              "Medical Professional"}
                          </p>

                          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
                            <span className="inline-flex items-center gap-2">
                              <FiMail className="shrink-0 text-orange-600" />
                              {selectedDoctor.email || "No email"}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <FiUser className="shrink-0 text-orange-600" />@
                              {selectedDoctor.username || "no-username"}
                            </span>

                            {selectedDoctor.phone && (
                              <span className="inline-flex items-center gap-2">
                                <FiPhone className="shrink-0 text-orange-600" />
                                {selectedDoctor.phone}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                selectedDoctor.registration_status ===
                                "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {selectedDoctor.registration_status ===
                              "COMPLETED"
                                ? "Registration Complete"
                                : "Registration Pending"}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {selectedDoctor.hospital_name ||
                                "Hospital not assigned"}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {selectedDoctor.branch_name ||
                                "Branch not assigned"}
                            </span>
                          </div>
                        </div>

                        {modal === "view" && canManage && (
                          <Button
                            variant="primary"
                            onClick={() => openEdit(selectedDoctor)}
                            className="shrink-0"
                          >
                            <FiEdit2 />
                            Edit Doctor
                          </Button>
                        )}
                      </div>
                    </section>
                  )}

                  {/* CREATE / EDIT FORM */}

                  {(modal === "create" || modal === "edit") && (
                    <form
                      onSubmit={modal === "create" ? createDoctor : saveDoctor}
                      className="space-y-5"
                    >
                      {modal === "create" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {[
                            ["01", "Account Details"],
                            ["02", "Organization"],
                            ["03", "Profile Picture"],
                          ].map(([number, label]) => (
                            <div
                              key={number}
                              className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3.5 shadow-sm"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-extrabold text-orange-700">
                                {number}
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Section title="Account Details" icon={FiShield}>
                        <Field
                          label="Username"
                          name="username"
                          value={accountForm.username}
                          onChange={updateAccount}
                          required
                          disabled={modal === "edit"}
                          autoComplete="off"
                          placeholder="e.g. dr.rahul"
                        />

                        <Field
                          label="Email Address"
                          name="email"
                          type="email"
                          value={accountForm.email}
                          onChange={updateAccount}
                          required
                          disabled={modal === "edit"}
                          autoComplete="email"
                          placeholder="doctor@hospital.com"
                        />

                        <Field
                          label="First Name"
                          name="first_name"
                          value={accountForm.first_name}
                          onChange={updateAccount}
                          required
                          placeholder="First name"
                        />

                        <Field
                          label="Last Name"
                          name="last_name"
                          value={accountForm.last_name}
                          onChange={updateAccount}
                          placeholder="Last name"
                        />

                        <Field
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          value={accountForm.phone}
                          onChange={updateAccount}
                          inputMode="numeric"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          placeholder="10-digit mobile number"
                          hint="Enter exactly 10 digits."
                        />

                        {modal === "create" && (
                          <>
                            <PasswordField
                              label="Temporary Password"
                              name="password"
                              value={accountForm.password}
                              onChange={updateAccount}
                              visible={showPassword}
                              onToggle={() =>
                                setShowPassword((value) => !value)
                              }
                              required
                              hint="Use at least 8 characters."
                            />

                            <PasswordField
                              label="Confirm Password"
                              name="confirm_password"
                              value={accountForm.confirm_password}
                              onChange={updateAccount}
                              visible={showConfirmPassword}
                              onToggle={() =>
                                setShowConfirmPassword((value) => !value)
                              }
                              required
                              hint={
                                accountForm.confirm_password
                                  ? accountForm.password ===
                                    accountForm.confirm_password
                                    ? "Passwords match."
                                    : "Passwords do not match."
                                  : "Re-enter the password."
                              }
                            />
                          </>
                        )}
                      </Section>

                      <Section
                        title="Hospital & Organization"
                        icon={FiBriefcase}
                      >
                        {isSuperUser ? (
                          <SelectField
                            label="Hospital"
                            name="hospital"
                            value={accountForm.hospital}
                            onChange={updateAccount}
                            options={hospitals}
                            required
                            placeholder="Select hospital"
                          />
                        ) : (
                          <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
                            <div className="flex items-center gap-2 text-orange-700">
                              <FiBriefcase size={17} />
                              <p className="text-sm font-bold">
                                Assigned Hospital
                              </p>
                            </div>

                            <p className="mt-2 font-extrabold text-slate-900">
                              {currentUser.hospital_name ||
                                currentUser.hospital?.name ||
                                hospitals.find(
                                  (hospital) =>
                                    String(hospital.id) === assignedHospital,
                                )?.name ||
                                (assignedHospital
                                  ? `Hospital #${assignedHospital}`
                                  : "Not assigned")}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              This doctor will be assigned to your hospital.
                            </p>
                          </div>
                        )}

                        <SelectField
                          label="Branch"
                          name="branch"
                          value={accountForm.branch}
                          onChange={updateAccount}
                          options={accountBranches}
                          required
                          disabled={!accountForm.hospital || lookupsLoading}
                          placeholder={
                            !accountForm.hospital
                              ? "Select hospital first"
                              : "Select branch"
                          }
                        />

                        <SelectField
                          label="Department"
                          name="department"
                          value={accountForm.department}
                          onChange={updateAccount}
                          options={accountDepartments}
                          disabled={!accountForm.branch || lookupsLoading}
                          placeholder={
                            !accountForm.branch
                              ? "Select branch first"
                              : "Select department"
                          }
                        />
                      </Section>

                      {/* PROFILE IMAGE */}

                      <Section
                        title="Doctor Profile Picture"
                        description="Upload a clear profile image. JPG, PNG and other browser-supported image formats are accepted, up to 5 MB."
                        icon={FiImage}
                        columns="lg:grid-cols-1"
                      >
                        <div className="sm:col-span-2 lg:col-span-1">
                          <div className="flex flex-col gap-5 rounded-2xl border border-dashed border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/60 p-5 sm:flex-row sm:items-center">
                            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
                              {accountImagePreview ? (
                                <img
                                  src={accountImagePreview}
                                  alt="Doctor profile preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-orange-300">
                                  <FiUser size={35} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Preview
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-slate-800">
                                Upload profile image
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                Choose a professional photo for the doctor's
                                profile. The maximum file size is 5 MB.
                              </p>

                              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-700">
                                <FiUploadCloud size={17} />
                                Choose Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleProfileImageChange}
                                />
                              </label>

                              {accountForm.profile_image && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="max-w-full break-all text-xs font-semibold text-emerald-700">
                                    {accountForm.profile_image.name}
                                  </span>

                                  <span className="text-xs text-slate-500">
                                    (
                                    {(
                                      accountForm.profile_image.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAccountForm((previous) => ({
                                        ...previous,
                                        profile_image: null,
                                      }));
                                      setAccountImagePreview("");
                                    }}
                                    className="text-xs font-bold text-rose-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Section>

                      {/* PROFESSIONAL FORM ONLY IN EDIT */}

                      {modal === "edit" && (
                        <>
                          <Section
                            title="Professional Information"
                            description="Update the doctor's medical registration, consultation details and availability."
                            icon={FiAward}
                          >
                            <Field
                              label="Specialization"
                              name="specialization"
                              value={profileForm.specialization}
                              onChange={updateProfile}
                              required
                              placeholder="e.g. Cardiology"
                            />

                            <Field
                              label="Qualification / Degree"
                              name="qualification"
                              value={profileForm.qualification}
                              onChange={updateProfile}
                              required
                              placeholder="e.g. MBBS, MD"
                            />

                            <Field
                              label="Medical Registration Number"
                              name="registration_number"
                              value={profileForm.registration_number}
                              onChange={updateProfile}
                              required
                            />

                            <Field
                              label="Experience (years)"
                              name="experience_years"
                              type="number"
                              min="0"
                              value={profileForm.experience_years}
                              onChange={updateProfile}
                              required
                            />

                            <Field
                              label="Consultation Fee (₹)"
                              name="consultation_fee"
                              type="number"
                              min="0"
                              step="0.01"
                              value={profileForm.consultation_fee}
                              onChange={updateProfile}
                              required
                            />

                            <label className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold text-slate-700">
                              <input
                                type="checkbox"
                                name="is_available"
                                checked={Boolean(profileForm.is_available)}
                                onChange={updateProfile}
                                className="h-4 w-4 accent-orange-600"
                              />
                              Available for appointments
                            </label>

                            <Field
                              label="Available From"
                              name="available_from"
                              type="time"
                              value={profileForm.available_from}
                              onChange={updateProfile}
                            />

                            <Field
                              label="Available To"
                              name="available_to"
                              type="time"
                              value={profileForm.available_to}
                              onChange={updateProfile}
                            />

                            <label className="block text-sm font-bold text-slate-700 sm:col-span-2 lg:col-span-3">
                              Professional Bio
                              <textarea
                                name="bio"
                                value={profileForm.bio}
                                onChange={updateProfile}
                                rows={4}
                                className={inputClass()}
                                placeholder="Experience, expertise and professional summary…"
                              />
                            </label>
                          </Section>

                          <Section
                            title="Professional Documents"
                            description="Upload PDF, JPG or PNG documents."
                            icon={FiFileText}
                          >
                            <DocumentUpload
                              label="Degree / Qualification Certificate"
                              name="degree_certificate"
                              currentUrl={selectedDoctor?.degree_certificate}
                              onChange={(name, file) =>
                                setDocumentFiles((previous) => ({
                                  ...previous,
                                  [name]: file,
                                }))
                              }
                            />

                            <DocumentUpload
                              label="Experience Letter"
                              name="experience_letter"
                              currentUrl={selectedDoctor?.experience_letter}
                              onChange={(name, file) =>
                                setDocumentFiles((previous) => ({
                                  ...previous,
                                  [name]: file,
                                }))
                              }
                            />

                            <DocumentUpload
                              label="Identity Document"
                              name="identity_document"
                              currentUrl={selectedDoctor?.identity_document}
                              onChange={(name, file) =>
                                setDocumentFiles((previous) => ({
                                  ...previous,
                                  [name]: file,
                                }))
                              }
                            />
                          </Section>
                        </>
                      )}

                      {/* ONE ACTION BAR ONLY */}

                      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <p className="hidden text-xs leading-5 text-slate-500 sm:block">
                          <span className="font-bold text-rose-500">*</span>{" "}
                          Required fields must be completed.
                        </p>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                          <Button
                            onClick={resetModal}
                            disabled={busy}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>

                          <Button
                            type="submit"
                            variant="primary"
                            disabled={
                              busy ||
                              (modal === "create" &&
                                accountForm.password !==
                                  accountForm.confirm_password)
                            }
                            className="w-full sm:w-auto"
                          >
                            {busy ? (
                              <FiRefreshCw className="animate-spin" />
                            ) : (
                              <FiSave />
                            )}

                            {busy
                              ? "Saving…"
                              : modal === "create"
                                ? "Create Doctor Account"
                                : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* VIEW DETAILS */}

                  {modal === "view" && selectedDoctor && (
                    <div className="space-y-5">
                      <Section
                        title="Professional Information"
                        description="Doctor's qualification, registration, consultation fee and availability."
                        icon={FiAward}
                      >
                        <DetailItem
                          label="Specialization"
                          value={selectedDoctor.specialization}
                          icon={FiActivity}
                        />

                        <DetailItem
                          label="Qualification"
                          value={selectedDoctor.qualification}
                          icon={FiAward}
                        />

                        <DetailItem
                          label="Registration Number"
                          value={selectedDoctor.registration_number}
                          icon={FiFileText}
                        />

                        <DetailItem
                          label="Experience"
                          value={`${selectedDoctor.experience_years ?? 0} years`}
                          icon={FiClock}
                        />

                        <DetailItem
                          label="Consultation Fee"
                          value={`₹${selectedDoctor.consultation_fee ?? 0}`}
                          icon={FiDollarSign}
                        />

                        <DetailItem
                          label="Availability"
                          value={
                            selectedDoctor.is_available
                              ? "Available for appointments"
                              : "Unavailable"
                          }
                          icon={FiCalendar}
                        />

                        <DetailItem
                          label="Available From"
                          value={selectedDoctor.available_from || "—"}
                          icon={FiClock}
                        />

                        <DetailItem
                          label="Available To"
                          value={selectedDoctor.available_to || "—"}
                          icon={FiClock}
                        />

                        <DetailItem
                          label="Hospital"
                          value={
                            selectedDoctor.hospital_name ||
                            selectedDoctor.hospital_id
                          }
                          icon={FiBriefcase}
                        />

                        <DetailItem
                          label="Branch"
                          value={
                            selectedDoctor.branch_name ||
                            selectedDoctor.branch_id
                          }
                          icon={FiMapPin}
                        />

                        <DetailItem
                          label="Department"
                          value={
                            selectedDoctor.department_name ||
                            selectedDoctor.department_id
                          }
                          icon={FiBriefcase}
                        />

                        <DetailItem
                          label="Phone Number"
                          value={selectedDoctor.phone}
                          icon={FiPhone}
                        />

                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Professional Bio
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                            {selectedDoctor.bio || "No bio added."}
                          </p>
                        </div>
                      </Section>

                      <Section title="Professional Documents" icon={FiFileText}>
                        {[
                          [
                            "Degree Certificate",
                            selectedDoctor.degree_certificate,
                          ],
                          [
                            "Experience Letter",
                            selectedDoctor.experience_letter,
                          ],
                          [
                            "Identity Document",
                            selectedDoctor.identity_document,
                          ],
                        ].map(([label, url]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <span className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-3 text-orange-700">
                                <FiFileText size={20} />
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800">
                                  {label}
                                </p>

                                {url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-orange-700 underline"
                                  >
                                    <FiEye />
                                    Open document
                                  </a>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-500">
                                    No document uploaded.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </Section>

                      <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <Button onClick={resetModal}>
                          <FiArrowLeft />
                          Back to Doctors
                        </Button>

                        {canManage && (
                          <Button
                            variant="primary"
                            onClick={() => openEdit(selectedDoctor)}
                          >
                            <FiEdit2 />
                            Edit Doctor
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
