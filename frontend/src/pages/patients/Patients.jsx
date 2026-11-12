import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  patientApi,
  branchApi,
  departmentApi,
  hospitalApi,
} from "../../api/service";

const ADMIN_ROLES = ["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"];
const SUPER_USER_ROLES = ["SUPER_USER", "SUPER_ADMIN"];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const ID_PROOF_OPTIONS = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
  { value: "voter_id", label: "Voter ID" },
  { value: "other", label: "Other" },
];

const EMPTY_PATIENT = {
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  email: "",
  mobile_number: "",
  address_line: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  blood_group: "",
  allergies: "",
  medical_history: "",
  emergency_contact: "",
  emergency_phone: "",
  insurance_provider: "",
  insurance_number: "",
  id_proof_type: "",
  id_proof_number: "",
  branch: "",
  department: "",
  assigned_doctor: "",
};

const EMPTY_ACCOUNT = {
  username: "",
  email: "",
  password: "",
  confirm_password: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  branch: "",
};

const READ_ONLY_FIELDS = [
  "id",
  "patient_id",
  "user",
  "username",
  "full_name",
  "hospital_id",
  "hospital_name",
  "branch_name",
  "department_name",
  "assigned_doctor_name",
  "is_active",
  "registration_complete",
  "registration_status",
  "created_at",
  "updated_at",
  "email_verified",
  "mobile_verified",
  "profile_image",
  "id_proof_document",
  "archived_at",
  "archived_by",
  "is_archived",
];

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function unwrap(response) {
  return response?.data ?? response;
}

function getList(response) {
  let payload = unwrap(response);

  for (let i = 0; i < 5; i += 1) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    for (const key of [
      "results",
      "items",
      "patients",
      "branches",
      "departments",
      "hospitals",
    ]) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    payload = payload.data;
  }

  return [];
}

function getErrorMessage(error) {
  const payload = error?.response?.data ?? error?.data ?? error;

  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload === "string") return payload;

  if (payload && typeof payload === "object") {
    const key = Object.keys(payload)[0];
    const value = payload[key];

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

  return "Something went wrong. Please try again.";
}

function getFullName(patient) {
  return (
    patient?.full_name ||
    [patient?.first_name, patient?.middle_name, patient?.last_name]
      .filter(Boolean)
      .join(" ") ||
    patient?.username ||
    "Unnamed patient"
  );
}

function getPatientKey(patient) {
  return patient?.patient_id ?? patient?.id;
}

function getBranchId(branch) {
  return branch?.id ?? branch?.branch_id ?? branch?.value ?? "";
}

function getBranchName(branch) {
  return (
    branch?.name ?? branch?.branch_name ?? branch?.title ?? "Unnamed branch"
  );
}

function shortPatientId(value) {
  if (!value) return "—";
  const normalized = String(value).replace(/[^a-zA-Z0-9]/g, "");
  return normalized.slice(0, 8).toUpperCase() || "—";
}

function getHospitalRecordId(hospital) {
  return hospital?.id ?? hospital?.hospital_id ?? hospital?.value ?? "";
}

function getHospitalRecordName(hospital) {
  return (
    hospital?.legal_name ||
    hospital?.name ||
    hospital?.hospital_name ||
    hospital?.title ||
    "Unnamed hospital"
  );
}

function getHospitalId(branch) {
  const hospital = branch?.hospital;

  return (
    branch?.hospital_id ??
    (typeof hospital === "object"
      ? (hospital?.id ?? hospital?.hospital_id)
      : hospital) ??
    ""
  );
}

function getPatientHospitalId(patient) {
  const hospital = patient?.hospital;
  const branch = patient?.branch;

  return (
    patient?.hospital_id ??
    (typeof hospital === "object"
      ? (hospital?.id ?? hospital?.hospital_id)
      : hospital) ??
    branch?.hospital_id ??
    (typeof branch?.hospital === "object"
      ? (branch?.hospital?.id ?? branch?.hospital?.hospital_id)
      : branch?.hospital) ??
    ""
  );
}

function getHospitalName(patient) {
  return (
    patient?.hospital_name ||
    patient?.hospital?.legal_name ||
    patient?.hospital?.name ||
    patient?.branch?.hospital_name ||
    patient?.branch?.hospital?.legal_name ||
    patient?.branch?.hospital?.name ||
    "—"
  );
}

function getBranchLabel(patient) {
  return (
    patient?.branch_name ||
    patient?.branch?.name ||
    (typeof patient?.branch === "string" || typeof patient?.branch === "number"
      ? String(patient.branch)
      : "") ||
    "—"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function humanize(value) {
  if (!value) return "Not provided";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRegistrationComplete(patient) {
  if (typeof patient?.registration_complete === "boolean") {
    return patient.registration_complete;
  }

  if (patient?.registration_status) {
    return String(patient.registration_status).toUpperCase() === "COMPLETED";
  }

  return Boolean(
    patient?.date_of_birth &&
    patient?.gender &&
    patient?.mobile_number &&
    patient?.address_line &&
    patient?.city &&
    patient?.state &&
    patient?.postal_code,
  );
}

function isActive(patient) {
  return patient?.is_active !== false;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getFileUrl(file) {
  if (!file) return "";
  if (typeof file === "string") return file;

  return file?.url || file?.file || file?.document || "";
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  type = "button",
  className = "",
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700 focus-visible:ring-amber-500",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50 focus-visible:ring-amber-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
    subtle:
      "text-slate-600 hover:bg-amber-50 hover:text-orange-700 focus-visible:ring-amber-400",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  options = [],
  disabled = false,
  hint = "",
  className = "",
  rows = 3,
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={INPUT_CLASS}
        >
          <option value="">Select {label.toLowerCase()}</option>

          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={`${INPUT_CLASS} resize-y`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={
            name === "password" || name === "confirm_password"
              ? "new-password"
              : name === "username"
                ? "username"
                : "off"
          }
          className={INPUT_CLASS}
        />
      )}

      {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RegistrationBadge({ complete }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        complete
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-amber-50 text-amber-800 ring-amber-200"
      }`}
    >
      {complete ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
      {complete ? "Complete" : "Pending"}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
  active,
  onClick,
}) {
  const tones = {
    amber: "from-amber-400 to-orange-500",
    green: "from-emerald-400 to-teal-500",
    slate: "from-slate-400 to-slate-600",
    blue: "from-orange-400 to-amber-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 ${
        active
          ? "border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-300"
          : "border-slate-200 hover:border-amber-200"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          tones[tone] || tones.amber
        }`}
      />

      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100/40 blur-2xl transition group-hover:bg-orange-200/50" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
          <p className="mt-3 text-xs font-bold text-orange-700">
            {active ? "Currently selected" : "Click to filter"}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
            tones[tone] || tones.amber
          } text-white shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-105`}
        >
          <Icon size={21} />
        </div>
      </div>
    </button>
  );
}

function Modal({
  title,
  subtitle,
  icon: Icon = FiUser,
  onClose,
  children,
  size = "max-w-4xl",
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`mx-auto my-3 flex max-h-[calc(100dvh-2rem)] w-full ${size} flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl sm:my-5 sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700">
              <Icon size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {title}
              </h2>

              {subtitle && (
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      )}
    </div>
  );
}

function FileUpload({
  label,
  accept,
  file,
  currentUrl,
  onChange,
  hint,
  preview = false,
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {preview && currentUrl && (
        <img
          src={currentUrl}
          alt="Patient profile preview"
          className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
        />
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3 transition hover:bg-amber-50">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm">
          <FiUpload size={17} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800">
            {file?.name || "Choose a file"}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Click to browse
          </span>
        </span>

        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onChange}
        />
      </label>

      {currentUrl && !file && !preview && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-semibold text-orange-700 underline underline-offset-2"
        >
          View existing document
        </a>
      )}

      {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

/* =========================================================
   PATIENT MANAGEMENT
========================================================= */

export default function Patients() {
  const navigate = useNavigate();

  const storedUser = useMemo(() => getStoredUser(), []);
  const role = String(storedUser?.role || "").toUpperCase();
  const canManage = ADMIN_ROLES.includes(role);
  const isSuperUser = SUPER_USER_ROLES.includes(role);

  const [patients, setPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [modal, setModal] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [profileForm, setProfileForm] = useState(EMPTY_PATIENT);
  const [branchSearch, setBranchSearch] = useState("");

  const [selectedHospital, setSelectedHospital] = useState("");

  // Registration wizard: Step 1 = Details, Step 2 = Documents
  const [editStep, setEditStep] = useState(1);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  useEffect(() => {
    if (!profileImagePreview.startsWith("blob:")) return undefined;

    return () => URL.revokeObjectURL(profileImagePreview);
  }, [profileImagePreview]);

  const closeModal = useCallback(() => {
    setModal(null);
    setSelectedPatient(null);
    setBranchSearch("");
    setSelectedHospital("");
    setProfileImageFile(null);
    setIdProofFile(null);
    setProfileImagePreview("");
    setEditStep(1);
  }, []);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await patientApi.list({
        ordering: "-created_at",
      });

      setPatients(getList(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);

    try {
      const response = await branchApi.list({
        page_size: 1000,
      });

      let items = getList(response);

      if (role === "HOSPITAL_ADMIN") {
        const hospitalId =
          storedUser?.hospital_id ?? storedUser?.hospital?.id ?? "";

        if (hospitalId) {
          items = items.filter(
            (branch) => String(getHospitalId(branch)) === String(hospitalId),
          );
        }
      }

      setBranches(items);
    } catch (err) {
      setBranches([]);
      setError(
        (current) =>
          current || `Unable to load branches. ${getErrorMessage(err)}`,
      );
    } finally {
      setBranchesLoading(false);
    }
  }, [role, storedUser]);

  const loadHospitals = useCallback(async () => {
    if (!isSuperUser) {
      setHospitals([]);
      return;
    }

    setHospitalsLoading(true);

    try {
      const response = await hospitalApi.list({
        page_size: 1000,
      });

      setHospitals(getList(response));
    } catch (err) {
      setHospitals([]);
      setError(
        (current) =>
          current || `Unable to load hospitals. ${getErrorMessage(err)}`,
      );
    } finally {
      setHospitalsLoading(false);
    }
  }, [isSuperUser]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await departmentApi.list({
        page_size: 1000,
      });

      setDepartments(getList(response));
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadPatients();
    loadBranches();
    loadDepartments();
    loadHospitals();
  }, [loadPatients, loadBranches, loadDepartments, loadHospitals]);

  useEffect(() => {
    if (!success) return undefined;

    const timeout = window.setTimeout(() => setSuccess(""), 3500);

    return () => window.clearTimeout(timeout);
  }, [success]);

  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();

    return branches.filter((branch) => {
      const name = getBranchName(branch).toLowerCase();

      const hospital = String(
        branch?.hospital_name ||
          branch?.hospital?.name ||
          branch?.hospital?.legal_name ||
          "",
      ).toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || hospital.includes(query);

      const matchesHospital =
        !isSuperUser ||
        (selectedHospital &&
          String(getHospitalId(branch)) === String(selectedHospital));

      return matchesSearch && Boolean(matchesHospital);
    });
  }, [branches, branchSearch, isSuperUser, selectedHospital]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const searchable = [
        getFullName(patient),
        patient?.username,
        patient?.patient_id,
        patient?.email,
        patient?.mobile_number,
        getHospitalName(patient),
        getBranchLabel(patient),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;

      if (statusFilter === "active" && !isActive(patient)) return false;
      if (statusFilter === "inactive" && isActive(patient)) return false;

      const complete = isRegistrationComplete(patient);

      if (registrationFilter === "completed" && !complete) return false;
      if (registrationFilter === "incomplete" && complete) return false;

      if (
        isSuperUser &&
        hospitalFilter !== "all" &&
        String(getPatientHospitalId(patient)) !== String(hospitalFilter)
      ) {
        return false;
      }

      if (
        !isSuperUser &&
        branchFilter !== "all" &&
        String(
          patient?.branch?.id ??
            patient?.branch?.branch_id ??
            patient?.branch ??
            "",
        ) !== String(branchFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [
    patients,
    search,
    statusFilter,
    registrationFilter,
    branchFilter,
    hospitalFilter,
    isSuperUser,
  ]);

  const stats = useMemo(
    () => ({
      total: patients.length,
      active: patients.filter(isActive).length,
      inactive: patients.filter((patient) => !isActive(patient)).length,
      incomplete: patients.filter((patient) => !isRegistrationComplete(patient))
        .length,
    }),
    [patients],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const visiblePatients = filteredPatients.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, registrationFilter, branchFilter, hospitalFilter]);

  const applySummaryFilter = (filter) => {
    setStatusFilter(
      filter === "active" || filter === "inactive" ? filter : "all",
    );

    setRegistrationFilter(filter === "incomplete" ? "incomplete" : "all");
    setPage(1);
  };

  const activeSummary =
    registrationFilter === "incomplete"
      ? "incomplete"
      : statusFilter === "active"
        ? "active"
        : statusFilter === "inactive"
          ? "inactive"
          : "total";

  const openCreate = () => {
    setError("");
    setSuccess("");
    setAccountForm({ ...EMPTY_ACCOUNT });
    setSelectedHospital("");
    setBranchSearch("");
    setModal("create");
  };

  const openView = (patient) => {
    const patientId = getPatientKey(patient);

    if (!patientId) {
      setError("Patient ID is missing. Unable to open the profile.");
      return;
    }

    navigate(`/patients/${patientId}`);
  };

  const openEdit = (patient) => {
    setError("");
    setSuccess("");
    setSelectedPatient(patient);
    setEditStep(1);

    setProfileForm({
      ...EMPTY_PATIENT,
      ...patient,
      branch:
        patient?.branch?.id ??
        patient?.branch?.branch_id ??
        patient?.branch ??
        "",
      department: patient?.department?.id ?? patient?.department ?? "",
      assigned_doctor:
        patient?.assigned_doctor?.id ?? patient?.assigned_doctor ?? "",
      date_of_birth: patient?.date_of_birth || "",
    });

    setProfileImageFile(null);
    setIdProofFile(null);

    setProfileImagePreview(
      getFileUrl(patient?.profile_image) ||
        getFileUrl(patient?.user?.profile_image),
    );

    setModal("edit");
  };

  const updateAccountField = (event) => {
    const { name, value } = event.target;

    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleHospitalChange = (event) => {
    const hospitalId = event.target.value;

    setSelectedHospital(hospitalId);

    setAccountForm((current) => ({
      ...current,
      branch: "",
    }));

    setBranchSearch("");
  };

  const updateProfileField = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Profile photo must be JPG, PNG or WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleIdProofChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setError("ID proof must be PDF, JPG or PNG.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ID proof document must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setIdProofFile(file);
  };

  const selectedBranch = useMemo(
    () =>
      branches.find(
        (branch) => String(getBranchId(branch)) === String(accountForm.branch),
      ),
    [branches, accountForm.branch],
  );

  const selectedBranchDepartments = useMemo(() => {
    if (!profileForm.branch) return departments;

    return departments.filter((department) => {
      const departmentBranch =
        department?.branch?.id ?? department?.branch ?? "";

      return (
        !departmentBranch ||
        String(departmentBranch) === String(profileForm.branch)
      );
    });
  }, [departments, profileForm.branch]);

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isSuperUser && !selectedHospital) {
      setError("Please select a hospital first.");
      return;
    }

    if (!accountForm.branch) {
      setError("Please select a branch.");
      return;
    }

    if (
      isSuperUser &&
      String(getHospitalId(selectedBranch)) !== String(selectedHospital)
    ) {
      setError("Please select a valid branch for the selected hospital.");
      return;
    }

    if (accountForm.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (accountForm.password !== accountForm.confirm_password) {
      setError("Password and confirm password do not match.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        username: accountForm.username.trim(),
        email: accountForm.email.trim().toLowerCase(),
        password: accountForm.password,
        confirm_password: accountForm.confirm_password,
        first_name: accountForm.first_name.trim(),
        last_name: accountForm.last_name.trim(),
        mobile_number: accountForm.mobile_number.trim(),
        branch: Number(accountForm.branch),
      };

      await patientApi.createAccount(payload);

      setSuccess("Patient account created successfully.");
      closeModal();
      await loadPatients();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // STEP 1: Patient details save
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!selectedPatient) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = { ...profileForm };

      READ_ONLY_FIELDS.forEach((key) => {
        delete payload[key];
      });

      if (payload.branch === "") {
        delete payload.branch;
      } else if (payload.branch) {
        payload.branch = Number(payload.branch);
      }

      if (payload.department === "") {
        payload.department = null;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }

      if (payload.assigned_doctor === "") {
        payload.assigned_doctor = null;
      } else if (payload.assigned_doctor) {
        payload.assigned_doctor = Number(payload.assigned_doctor);
      }

      await patientApi.completeRegistration(
        getPatientKey(selectedPatient),
        payload,
      );

      setEditStep(2);
      setSuccess("Patient details saved. Now upload patient documents.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // STEP 2: Documents upload
  const handleSaveDocuments = async (event) => {
    event.preventDefault();

    if (!selectedPatient) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (profileImageFile || idProofFile) {
        const formData = new FormData();

        if (profileImageFile) {
          formData.append("profile_image", profileImageFile);
        }

        if (idProofFile) {
          formData.append("id_proof_document", idProofFile);
        }

        await patientApi.completeRegistration(
          getPatientKey(selectedPatient),
          formData,
        );
      }

      setSuccess("Patient registration updated successfully.");
      closeModal();
      await loadPatients();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (patient) => {
    if (!canManage) return;

    const patientId = getPatientKey(patient);
    const nextActive = !isActive(patient);

    const confirmed = window.confirm(
      nextActive
        ? `Activate ${getFullName(patient)}?`
        : `Deactivate ${getFullName(patient)}? The patient may no longer be able to log in.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await patientApi.setStatus(patientId, nextActive);

      setSuccess(
        nextActive
          ? "Patient activated successfully."
          : "Patient deactivated successfully.",
      );

      await loadPatients();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (patient) => {
    if (!canManage) return;

    const patientId = getPatientKey(patient);
    const patientName = getFullName(patient);

    const confirmed = window.confirm(
      `Archive ${patientName}? The patient record will not be permanently deleted.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await patientApi.archive(patientId);

      setPatients((current) =>
        current.filter(
          (item) => String(getPatientKey(item)) !== String(patientId),
        ),
      );

      setSuccess("Patient archived successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  return (
    <div className="min-h-full space-y-6 bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
            <FiUsers size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Patient Management
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              loadPatients();
              loadBranches();
              loadDepartments();
              loadHospitals();
            }}
          >
            <FiRefreshCw size={15} />
            Refresh
          </Button>

          {canManage && (
            <Button variant="primary" onClick={openCreate}>
              <FiPlus size={17} />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" size={17} />
          <p className="min-w-0 flex-1 break-words">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <FiCheckCircle className="mt-0.5 shrink-0" size={17} />
          <p className="min-w-0 flex-1">{success}</p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FiUsers}
          label="Total Patients"
          value={stats.total}
          tone="blue"
          active={activeSummary === "total"}
          onClick={() => applySummaryFilter("total")}
        />

        <StatCard
          icon={FiUserCheck}
          label="Active Patients"
          value={stats.active}
          tone="green"
          active={activeSummary === "active"}
          onClick={() => applySummaryFilter("active")}
        />

        <StatCard
          icon={FiShield}
          label="Inactive Patients"
          value={stats.inactive}
          tone="slate"
          active={activeSummary === "inactive"}
          onClick={() => applySummaryFilter("inactive")}
        />

        <StatCard
          icon={FiActivity}
          label="Incomplete Profiles"
          value={stats.incomplete}
          tone="amber"
          active={activeSummary === "incomplete"}
          onClick={() => applySummaryFilter("incomplete")}
        />
      </div>

      {/* Patient table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Patients</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredPatients.length} patient
              {filteredPatients.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
            <div className="relative min-w-0 sm:col-span-2 xl:w-72">
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, ID, phone, email..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div className="relative">
              <FiFilter
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-amber-500 sm:w-36"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <select
              value={registrationFilter}
              onChange={(event) => setRegistrationFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-amber-500 sm:w-44"
            >
              <option value="all">All registrations</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Pending registration</option>
            </select>

            {/* Super User: Hospital filter | Hospital Admin: Branch filter */}
            {isSuperUser ? (
              <select
                value={hospitalFilter}
                onChange={(event) => setHospitalFilter(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-amber-500 sm:w-48"
              >
                <option value="all">All Hospitals</option>

                {hospitals.map((hospital) => (
                  <option
                    key={getHospitalRecordId(hospital)}
                    value={getHospitalRecordId(hospital)}
                  >
                    {getHospitalRecordName(hospital)}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-amber-500 sm:w-44"
              >
                <option value="all">All branches</option>

                {branches.map((branch) => (
                  <option key={getBranchId(branch)} value={getBranchId(branch)}>
                    {getBranchName(branch)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {[
                  "Patient",
                  "Gender",
                  "Hospital",
                  "Branch",
                  "Phone Number",
                  "Registration",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 first:pl-5 last:pr-5"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <span className="inline-flex items-center gap-3 text-sm font-medium text-slate-500">
                      <FiRefreshCw
                        className="animate-spin text-amber-600"
                        size={18}
                      />
                      Loading patient records...
                    </span>
                  </td>
                </tr>
              ) : visiblePatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <FiUsers size={25} />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-800">
                      No patients found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filters.
                    </p>

                    {canManage && (
                      <div className="mt-4">
                        <Button variant="primary" onClick={openCreate}>
                          <FiPlus size={16} />
                          Add Patient
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                visiblePatients.map((patient) => {
                  const patientId = getPatientKey(patient);
                  const complete = isRegistrationComplete(patient);

                  const avatarUrl =
                    getFileUrl(patient?.profile_image) ||
                    getFileUrl(patient?.user?.profile_image);

                  return (
                    <tr
                      key={patientId}
                      className="transition hover:bg-amber-50/30"
                    >
                      <td className="px-4 py-4 pl-5">
                        <div className="flex min-w-0 items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={getFullName(patient)}
                              className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-orange-800">
                              {getFullName(patient)
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase())
                                .join("") || "P"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openView(patient)}
                              className="block max-w-[220px] truncate text-left text-sm font-bold text-slate-800 hover:text-orange-700"
                            >
                              {getFullName(patient)}
                            </button>

                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                              @{patient?.username || "no-username"}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              ID:{" "}
                              {shortPatientId(
                                patient?.patient_id || patient?.id || "—",
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {humanize(patient?.gender)}
                      </td>

                      <td className="max-w-[190px] px-4 py-4">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {getHospitalName(patient)}
                        </p>
                      </td>

                      <td className="max-w-[180px] px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <FiMapPin
                            size={13}
                            className="shrink-0 text-amber-600"
                          />
                          <span className="truncate">
                            {getBranchLabel(patient)}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {patient?.mobile_number || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <RegistrationBadge complete={complete} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge active={isActive(patient)} />
                      </td>

                      <td className="px-4 py-4 pr-5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="View full patient profile"
                            aria-label="View patient profile"
                            onClick={() => openView(patient)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                          >
                            <FiEye size={16} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                title={
                                  complete
                                    ? "Edit patient details"
                                    : "Complete registration"
                                }
                                aria-label="Edit patient details or complete registration"
                                onClick={() => openEdit(patient)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                              >
                                {complete ? (
                                  <FiEdit2 size={15} />
                                ) : (
                                  <FiCheckCircle size={16} />
                                )}
                              </button>

                              <button
                                type="button"
                                title={
                                  isActive(patient)
                                    ? "Deactivate patient"
                                    : "Activate patient"
                                }
                                aria-label={
                                  isActive(patient)
                                    ? "Deactivate patient"
                                    : "Activate patient"
                                }
                                onClick={() => handleStatusToggle(patient)}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                                  isActive(patient)
                                    ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {isActive(patient) ? (
                                  <FiShield size={15} />
                                ) : (
                                  <FiCheck size={16} />
                                )}
                              </button>

                              <button
                                type="button"
                                title="Archive patient"
                                aria-label="Archive patient"
                                onClick={() => handleDelete(patient)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </>
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

        {!loading && filteredPatients.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(safePage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(safePage * pageSize, filteredPatients.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredPatients.length}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <FiChevronLeft size={15} />
                Previous
              </Button>

              <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                {safePage} / {totalPages}
              </span>

              <Button
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage >= totalPages}
              >
                Next
                <FiChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* CREATE ACCOUNT MODAL */}
      {modal === "create" && (
        <Modal
          title="Add Patient"
          subtitle="Create a patient login account."
          icon={FiUser}
          onClose={closeModal}
          size="max-w-3xl"
        >
          <form onSubmit={handleCreateAccount}>
            <div className="space-y-6 p-4 sm:p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">
                  Patient account setup
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  The patient can complete remaining profile information after
                  the account is created.
                </p>
              </div>

              <section>
                <SectionHeading title="Login Credentials" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Username"
                    name="username"
                    value={accountForm.username}
                    onChange={updateAccountField}
                    required
                    placeholder="e.g. rahul.patient"
                  />

                  <Field
                    label="Email Address"
                    name="email"
                    type="email"
                    value={accountForm.email}
                    onChange={updateAccountField}
                    required
                    placeholder="patient@example.com"
                  />

                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    value={accountForm.password}
                    onChange={updateAccountField}
                    required
                    placeholder="Minimum 8 characters"
                  />

                  <Field
                    label="Confirm Password"
                    name="confirm_password"
                    type="password"
                    value={accountForm.confirm_password}
                    onChange={updateAccountField}
                    required
                    placeholder="Enter password again"
                  />
                </div>
              </section>

              <section>
                <SectionHeading title="Basic Patient Information" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="First Name"
                    name="first_name"
                    value={accountForm.first_name}
                    onChange={updateAccountField}
                    required
                  />

                  <Field
                    label="Last Name"
                    name="last_name"
                    value={accountForm.last_name}
                    onChange={updateAccountField}
                    required
                  />

                  <Field
                    label="Mobile Number"
                    name="mobile_number"
                    value={accountForm.mobile_number}
                    onChange={updateAccountField}
                    placeholder="Enter mobile number"
                    hint="Included in the existing create-account API payload."
                  />
                </div>
              </section>

              <section>
                <SectionHeading
                  title="Hospital & Branch"
                  description={
                    isSuperUser
                      ? "Select a hospital first, then choose one of its branches."
                      : "Select the branch for this patient."
                  }
                />

                {isSuperUser && (
                  <div className="mb-4">
                    <Field
                      label="Hospital"
                      name="hospital"
                      type="select"
                      value={selectedHospital}
                      onChange={handleHospitalChange}
                      required
                      disabled={hospitalsLoading}
                      options={hospitals.map((hospital) => ({
                        value: getHospitalRecordId(hospital),
                        label: getHospitalRecordName(hospital),
                      }))}
                      hint={
                        hospitalsLoading
                          ? "Loading hospitals..."
                          : hospitals.length === 0
                            ? "No hospitals available."
                            : "Choose the hospital before selecting a branch."
                      }
                    />
                  </div>
                )}

                <Field
                  label="Search Branch"
                  name="branch_search"
                  value={branchSearch}
                  onChange={(event) => setBranchSearch(event.target.value)}
                  placeholder="Search branch or hospital..."
                  disabled={isSuperUser && !selectedHospital}
                />

                <div className="mt-4">
                  <Field
                    label="Branch"
                    name="branch"
                    type="select"
                    value={accountForm.branch}
                    onChange={updateAccountField}
                    required
                    disabled={
                      branchesLoading || (isSuperUser && !selectedHospital)
                    }
                    options={filteredBranches.map((branch) => ({
                      value: getBranchId(branch),
                      label: `${getBranchName(branch)}${
                        branch?.hospital_name || branch?.hospital?.name
                          ? ` — ${
                              branch?.hospital_name || branch?.hospital?.name
                            }`
                          : ""
                      }`,
                    }))}
                    hint={
                      branchesLoading
                        ? "Loading branches..."
                        : isSuperUser && !selectedHospital
                          ? "Please select a hospital first."
                          : filteredBranches.length === 0
                            ? "No branches available for this hospital."
                            : "Select the branch where the patient will be registered."
                    }
                  />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold text-slate-500">
                    Linked Hospital
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {selectedBranch
                      ? selectedBranch?.hospital_name ||
                        selectedBranch?.hospital?.name ||
                        (typeof selectedBranch?.hospital === "string" ||
                        typeof selectedBranch?.hospital === "number"
                          ? `Hospital ID: ${selectedBranch.hospital}`
                          : "Hospital name not returned")
                      : isSuperUser && selectedHospital
                        ? getHospitalRecordName(
                            hospitals.find(
                              (hospital) =>
                                String(getHospitalRecordId(hospital)) ===
                                String(selectedHospital),
                            ) || {},
                          )
                        : "Select a branch to display its hospital"}
                  </p>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button onClick={closeModal} disabled={saving}>
                Cancel
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={
                  saving ||
                  branchesLoading ||
                  hospitalsLoading ||
                  (isSuperUser && !selectedHospital)
                }
              >
                {saving ? (
                  <FiRefreshCw className="animate-spin" size={15} />
                ) : (
                  <FiPlus size={16} />
                )}

                {saving ? "Creating..." : "Create Patient Account"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT / COMPLETE REGISTRATION MODAL */}
      {modal === "edit" && selectedPatient && (
        <Modal
          title={
            editStep === 1
              ? isRegistrationComplete(selectedPatient)
                ? "Edit Patient Details"
                : "Complete Patient Registration"
              : "Upload Patient Documents"
          }
          subtitle={
            editStep === 1
              ? "Step 1 of 2 — Enter personal, contact and medical details."
              : "Step 2 of 2 — Attach the patient's profile photo and identity proof."
          }
          icon={editStep === 1 ? FiEdit2 : FiUpload}
          onClose={closeModal}
          size="max-w-4xl"
        >
          <form
            onSubmit={editStep === 1 ? handleSaveProfile : handleSaveDocuments}
          >
            <div className="space-y-6 p-4 sm:p-6">
              {/* Step progress */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      editStep === 1
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {editStep === 1 ? "1" : <FiCheck size={17} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      Patient Details
                    </p>
                    <p className="text-xs text-slate-500">
                      Personal and medical information
                    </p>
                  </div>

                  <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        editStep === 2 ? "w-full" : "w-1/2"
                      } bg-gradient-to-r from-amber-500 to-orange-600`}
                    />
                  </div>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      editStep === 2
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    2
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">
                      Documents
                    </p>
                    <p className="text-xs text-slate-500">Photo and ID proof</p>
                  </div>
                </div>
              </div>

              {editStep === 1 ? (
                <>
                  {!isRegistrationComplete(selectedPatient) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2.5">
                        <FiAlertCircle
                          className="mt-0.5 shrink-0 text-amber-700"
                          size={17}
                        />

                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            Pending registration
                          </p>

                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            Complete the patient details below. After saving,
                            you can upload documents in the next step.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <section>
                    <SectionHeading title="Personal Information" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="First Name"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={updateProfileField}
                        required
                      />

                      <Field
                        label="Middle Name"
                        name="middle_name"
                        value={profileForm.middle_name}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Last Name"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={updateProfileField}
                        required
                      />

                      <Field
                        label="Date of Birth"
                        name="date_of_birth"
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Gender"
                        name="gender"
                        type="select"
                        value={profileForm.gender}
                        onChange={updateProfileField}
                        options={GENDER_OPTIONS}
                      />

                      <Field
                        label="Blood Group"
                        name="blood_group"
                        value={profileForm.blood_group}
                        onChange={updateProfileField}
                        placeholder="e.g. O+"
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeading title="Contact Information" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Email Address"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={updateProfileField}
                        required
                      />

                      <Field
                        label="Mobile Number"
                        name="mobile_number"
                        value={profileForm.mobile_number}
                        onChange={updateProfileField}
                        placeholder="Enter mobile number"
                      />

                      <Field
                        label="Address Line 1"
                        name="address_line"
                        type="textarea"
                        value={profileForm.address_line}
                        onChange={updateProfileField}
                        className="sm:col-span-2"
                        rows={2}
                      />

                      <Field
                        label="Address Line 2"
                        name="address_line_2"
                        value={profileForm.address_line_2}
                        onChange={updateProfileField}
                        placeholder="Apartment, street, landmark"
                        className="sm:col-span-2"
                      />

                      <Field
                        label="City"
                        name="city"
                        value={profileForm.city}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="State"
                        name="state"
                        value={profileForm.state}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Postal Code"
                        name="postal_code"
                        value={profileForm.postal_code}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Country"
                        name="country"
                        value={profileForm.country}
                        onChange={updateProfileField}
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeading title="Hospital & Clinical Information" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Branch"
                        name="branch"
                        type="select"
                        value={profileForm.branch}
                        onChange={updateProfileField}
                        options={branches.map((branch) => ({
                          value: getBranchId(branch),
                          label: getBranchName(branch),
                        }))}
                      />

                      <Field
                        label="Department"
                        name="department"
                        type="select"
                        value={profileForm.department}
                        onChange={updateProfileField}
                        options={selectedBranchDepartments.map(
                          (department) => ({
                            value: department?.id,
                            label:
                              department?.name ||
                              department?.department_name ||
                              `Department ${department?.id}`,
                          }),
                        )}
                      />

                      <Field
                        label="Assigned Doctor ID"
                        name="assigned_doctor"
                        value={profileForm.assigned_doctor}
                        onChange={updateProfileField}
                        placeholder="Optional numeric doctor user ID"
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeading title="Medical & Emergency Information" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Allergies"
                        name="allergies"
                        type="textarea"
                        value={profileForm.allergies}
                        onChange={updateProfileField}
                        rows={2}
                      />

                      <Field
                        label="Medical History"
                        name="medical_history"
                        type="textarea"
                        value={profileForm.medical_history}
                        onChange={updateProfileField}
                        rows={2}
                      />

                      <Field
                        label="Emergency Contact Name"
                        name="emergency_contact"
                        value={profileForm.emergency_contact}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Emergency Contact Phone"
                        name="emergency_phone"
                        value={profileForm.emergency_phone}
                        onChange={updateProfileField}
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeading title="Insurance & Identity Information" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Insurance Provider"
                        name="insurance_provider"
                        value={profileForm.insurance_provider}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="Insurance Number"
                        name="insurance_number"
                        value={profileForm.insurance_number}
                        onChange={updateProfileField}
                      />

                      <Field
                        label="ID Proof Type"
                        name="id_proof_type"
                        type="select"
                        value={profileForm.id_proof_type}
                        onChange={updateProfileField}
                        options={ID_PROOF_OPTIONS}
                      />

                      <Field
                        label="ID Proof Number"
                        name="id_proof_number"
                        value={profileForm.id_proof_number}
                        onChange={updateProfileField}
                      />
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <FiCheckCircle
                        className="mt-0.5 shrink-0 text-emerald-700"
                        size={19}
                      />

                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          Patient details saved
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          Now upload the patient's profile photo and identity
                          proof. Both documents are optional.
                        </p>
                      </div>
                    </div>
                  </div>

                  <section>
                    <SectionHeading
                      title="Profile Photo"
                      description="Optional. JPG, PNG or WEBP, maximum 5 MB."
                    />

                    <FileUpload
                      label="Patient Profile Photo"
                      accept="image/jpeg,image/png,image/webp"
                      file={profileImageFile}
                      currentUrl={profileImagePreview}
                      onChange={handleProfileImageChange}
                      preview
                      hint="Select a new photo to replace the current photo."
                    />
                  </section>

                  <section>
                    <SectionHeading
                      title="Identity Documents"
                      description="Upload the patient's identity proof document."
                    />

                    <Field
                      label="ID Proof Type"
                      name="id_proof_type"
                      type="select"
                      value={profileForm.id_proof_type}
                      onChange={updateProfileField}
                      options={ID_PROOF_OPTIONS}
                    />

                    <div className="mt-4">
                      <FileUpload
                        label="Aadhaar / ID Proof Document"
                        accept="application/pdf,image/jpeg,image/png"
                        file={idProofFile}
                        currentUrl={getFileUrl(
                          selectedPatient?.id_proof_document,
                        )}
                        onChange={handleIdProofChange}
                        hint="PDF, JPG or PNG, maximum 5 MB. Leave blank to keep the existing document."
                      />
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                {editStep === 2 && (
                  <Button
                    onClick={() => {
                      setError("");
                      setEditStep(1);
                    }}
                    disabled={saving}
                  >
                    <FiChevronLeft size={15} />
                    Back to Details
                  </Button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>

                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? (
                    <FiRefreshCw className="animate-spin" size={15} />
                  ) : editStep === 1 ? (
                    <FiChevronRight size={16} />
                  ) : (
                    <FiCheck size={16} />
                  )}

                  {saving
                    ? "Saving..."
                    : editStep === 1
                      ? "Save & Continue"
                      : "Save Documents & Finish"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
