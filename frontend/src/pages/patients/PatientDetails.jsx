import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { patientApi } from "../../api/service";

const ADMIN_ROLES = ["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"];

function getErrorMessage(error) {
  const payload = error?.response?.data ?? error?.data ?? error;

  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.message === "string") return payload.message;

  if (payload && typeof payload === "object") {
    const key = Object.keys(payload)[0];
    const value = payload[key];

    if (Array.isArray(value)) {
      return `${key.replaceAll("_", " ")}: ${value[0]}`;
    }

    if (typeof value === "string") {
      return `${key.replaceAll("_", " ")}: ${value}`;
    }
  }

  return "Something went wrong. Please try again.";
}

function unwrap(response) {
  return response?.data ?? response;
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

function isActive(patient) {
  return patient?.is_active !== false;
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

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

/**
 * Supports absolute URLs and relative media paths.
 * Relative paths are resolved against the configured API origin.
 */
function getMediaUrl(value) {
  if (!value || typeof value !== "string") return "";

  const path = value.trim();

  if (!path) return "";

  if (/^(https?:\/\/|blob:|data:)/i.test(path)) {
    return path;
  }

  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  try {
    const apiOrigin = new URL(configuredBase, window.location.origin).origin;
    return new URL(path, apiOrigin).href;
  } catch {
    return path;
  }
}

function getProfilePhoto(patient) {
  const image =
    patient?.profile_image ||
    patient?.user?.profile_image ||
    patient?.user_profile_image;

  if (typeof image === "string") {
    return getMediaUrl(image);
  }

  return getMediaUrl(image?.url);
}

function getIdentityDocument(patient) {
  const document =
    patient?.id_proof_document ||
    patient?.identity_document ||
    patient?.id_document;

  if (typeof document === "string") {
    return getMediaUrl(document);
  }

  return getMediaUrl(document?.url);
}

function maskIdentityNumber(value) {
  if (!value) return "Not provided";

  const text = String(value).trim();

  if (text.length <= 4) {
    return "•".repeat(text.length);
  }

  return `${"•".repeat(Math.min(text.length - 4, 12))}${text.slice(-4)}`;
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
        complete
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-amber-50 text-amber-800 ring-amber-200"
      }`}
    >
      {complete ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
      {complete ? "Registration Complete" : "Registration Pending"}
    </span>
  );
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700">
          <Icon size={18} />
        </div>

        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-amber-200 hover:bg-amber-50/30">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {Icon && <Icon size={14} className="text-amber-600" />}
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-semibold leading-5 text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function ProfilePhoto({ patient }) {
  const [imageFailed, setImageFailed] = useState(false);

  const photoUrl = getProfilePhoto(patient);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const initials = getFullName(patient)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/15 text-2xl font-extrabold shadow-inner">
      {photoUrl && !imageFailed ? (
        <img
          src={photoUrl}
          alt={`${getFullName(patient)} profile`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials || "P"
      )}
    </div>
  );
}

function IdentityDocumentCard({ patient }) {
  const documentUrl = getIdentityDocument(patient);

  return (
    <div className="col-span-1 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <FiFileText size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">
              Uploaded ID Proof
            </h3>

            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
              {documentUrl
                ? "An identity document is available for authorized review."
                : "No ID proof document is available in the patient record."}
            </p>
          </div>
        </div>

        {documentUrl && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FiExternalLink size={15} />
              View Document
            </a>

            <a
              href={documentUrl}
              download
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <FiDownload size={15} />
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const role = String(getStoredUser()?.role || "").toUpperCase();
  const canManage = ADMIN_ROLES.includes(role);

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPatient = useCallback(async () => {
    if (!patientId) {
      setError("Patient ID is missing from the URL.");
      setPatient(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await patientApi.get(patientId);
      const data = unwrap(response);

      if (!data || typeof data !== "object") {
        throw new Error("Patient record was not returned by the server.");
      }

      setPatient(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleStatusToggle = async () => {
    if (!patient || !canManage || busy) return;

    const nextActive = !isActive(patient);

    const confirmed = window.confirm(
      nextActive
        ? `Activate ${getFullName(patient)}?`
        : `Deactivate ${getFullName(patient)}? The patient may no longer be able to log in.`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await patientApi.setStatus(patientId, nextActive);

      setSuccess(
        nextActive
          ? "Patient activated successfully."
          : "Patient deactivated successfully.",
      );

      await loadPatient();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!patient || !canManage || busy) return;

    const confirmed = window.confirm(
      `Archive ${getFullName(patient)}? The patient record will be retained rather than permanently deleted.`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (typeof patientApi.archive !== "function") {
        throw new Error(
          "Archive API is not configured. Add patientApi.archive in your API service before archiving patients.",
        );
      }

      await patientApi.archive(patientId);

      navigate("/patients", {
        replace: true,
        state: {
          message: "Patient archived successfully.",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          <FiRefreshCw className="animate-spin text-amber-600" size={20} />
          Loading patient profile...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-7">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 text-rose-600" size={22} />

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Unable to load patient
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                {error || "Patient record could not be found."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <ActionButton onClick={loadPatient} variant="primary">
                  <FiRefreshCw size={15} />
                  Try Again
                </ActionButton>

                <ActionButton onClick={() => navigate("/patients")}>
                  <FiArrowLeft size={16} />
                  Back to Patients
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const complete = isRegistrationComplete(patient);

  const branchName =
    patient?.branch_name ||
    patient?.branch?.name ||
    (typeof patient?.branch === "string" || typeof patient?.branch === "number"
      ? String(patient.branch)
      : "—");

  const departmentName =
    patient?.department_name ||
    patient?.department?.name ||
    (typeof patient?.department === "string" ? patient.department : "—");

  const doctorName =
    patient?.assigned_doctor_name ||
    patient?.assigned_doctor?.full_name ||
    patient?.assigned_doctor?.name ||
    "—";

  const hospitalName =
    patient?.hospital_name ||
    patient?.branch?.hospital_name ||
    patient?.branch?.hospital?.name ||
    "—";

  return (
    <div className="min-h-full space-y-6 bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Patient Profile
          </h1>
        </div>

        <ActionButton onClick={loadPatient} disabled={busy}>
          <FiRefreshCw size={15} />
          Refresh
        </ActionButton>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" size={17} />

          <p className="flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FiCheck size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {success}
        </div>
      )}

      {/* Patient hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-700 p-5 text-white shadow-xl shadow-orange-500/15 sm:p-7">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-amber-200/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <ProfilePhoto patient={patient} />

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl font-extrabold sm:text-3xl">
              {getFullName(patient)}
            </h2>

            <p className="mt-1 text-sm text-orange-50">
              @{patient?.username || patient?.user?.username || "No username"}
            </p>

            <p className="mt-1 text-xs text-orange-100">
              Patient ID: {patient?.patient_id || patient?.id || patientId}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge active={isActive(patient)} />
              <RegistrationBadge complete={complete} />
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={() => navigate("/patients")}
                variant="secondary"
              >
                <FiEdit2 size={15} />
                Edit Details
              </ActionButton>

              <ActionButton
                onClick={handleStatusToggle}
                disabled={busy}
                variant={isActive(patient) ? "secondary" : "success"}
              >
                {isActive(patient) ? (
                  <FiShield size={15} />
                ) : (
                  <FiCheck size={15} />
                )}
                {isActive(patient) ? "Deactivate" : "Activate"}
              </ActionButton>

              <ActionButton
                onClick={handleArchive}
                disabled={busy}
                variant="danger"
              >
                <FiFileText size={15} />
                Archive Patient
              </ActionButton>
            </div>
          )}
        </div>
      </section>

      {!complete && (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FiAlertCircle
              className="mt-0.5 shrink-0 text-amber-700"
              size={19}
            />

            <div>
              <p className="text-sm font-bold text-amber-900">
                Registration is pending
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Some personal or contact details are still missing. Complete the
                registration from the Patients list.
              </p>
            </div>
          </div>

          <ActionButton onClick={() => navigate("/patients")} variant="primary">
            <FiCheckCircle size={15} />
            Complete Registration
          </ActionButton>
        </section>
      )}

      <DetailSection title="Contact Information" icon={FiPhone}>
        <DetailItem
          label="Email Address"
          value={patient?.email || patient?.user?.email}
          icon={FiMail}
        />

        <DetailItem
          label="Mobile Number"
          value={patient?.mobile_number || patient?.phone_number}
          icon={FiPhone}
        />

        <DetailItem
          label="Gender"
          value={humanize(patient?.gender)}
          icon={FiUser}
        />

        <DetailItem
          label="Date of Birth"
          value={formatDate(patient?.date_of_birth)}
          icon={FiCalendar}
        />

        <DetailItem
          label="Registered On"
          value={formatDate(patient?.created_at)}
          icon={FiCalendar}
        />

        <DetailItem
          label="Blood Group"
          value={patient?.blood_group}
          icon={FiHeart}
        />
      </DetailSection>

      <DetailSection title="Hospital & Clinical Information" icon={FiActivity}>
        <DetailItem label="Hospital" value={hospitalName} />

        <DetailItem label="Branch" value={branchName} icon={FiMapPin} />

        <DetailItem label="Department" value={departmentName} />

        <DetailItem label="Assigned Doctor" value={doctorName} />
      </DetailSection>

      <DetailSection title="Address Information" icon={FiMapPin}>
        <DetailItem label="Address Line" value={patient?.address_line} />
        <DetailItem label="City" value={patient?.city} />
        <DetailItem label="State" value={patient?.state} />
        <DetailItem label="Postal Code" value={patient?.postal_code} />
        <DetailItem label="Country" value={patient?.country} />
      </DetailSection>

      <DetailSection title="Medical Information" icon={FiHeart}>
        <DetailItem label="Allergies" value={patient?.allergies} />
        <DetailItem label="Medical History" value={patient?.medical_history} />
      </DetailSection>

      <DetailSection title="Emergency Contact" icon={FiPhone}>
        <DetailItem label="Contact Name" value={patient?.emergency_contact} />

        <DetailItem label="Contact Phone" value={patient?.emergency_phone} />
      </DetailSection>

      {/* Insurance is separate from identity documents */}
      <DetailSection title="Insurance Information" icon={FiShield}>
        <DetailItem
          label="Insurance Provider"
          value={patient?.insurance_provider}
        />

        <DetailItem
          label="Insurance Number"
          value={patient?.insurance_number}
        />
      </DetailSection>

      {/* Identity documents */}
      <DetailSection title="Identity Documents" icon={FiFileText}>
        <DetailItem
          label="Patient ID"
          value={patient?.patient_id || patient?.id || patientId}
        />

        <DetailItem
          label="ID Proof Type"
          value={humanize(patient?.id_proof_type)}
        />

        <DetailItem
          label="ID Proof Number"
          value={maskIdentityNumber(patient?.id_proof_number)}
        />

        <IdentityDocumentCard patient={patient} />
      </DetailSection>

      <DetailSection title="Verification Status" icon={FiCheckCircle}>
        <DetailItem
          label="Email Verification"
          value={
            (patient?.email_verified ?? patient?.user?.is_email_verified)
              ? "Verified"
              : "Not verified"
          }
        />

        <DetailItem
          label="Mobile Verification"
          value={patient?.mobile_verified ? "Verified" : "Not verified"}
        />

        <DetailItem
          label="Account Status"
          value={isActive(patient) ? "Active" : "Inactive"}
        />

        <DetailItem
          label="Registration Status"
          value={complete ? "Complete" : "Pending"}
        />
      </DetailSection>

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
        <ActionButton onClick={() => navigate("/patients")}>
          <FiArrowLeft size={15} />
          Back to Patients
        </ActionButton>

        {canManage && (
          <ActionButton
            onClick={handleStatusToggle}
            disabled={busy}
            variant={isActive(patient) ? "secondary" : "success"}
          >
            {isActive(patient) ? <FiShield size={15} /> : <FiCheck size={15} />}
            {isActive(patient) ? "Deactivate Patient" : "Activate Patient"}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
