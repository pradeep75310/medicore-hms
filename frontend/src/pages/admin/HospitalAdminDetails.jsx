
import React from "react";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiHome,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiActivity,
} from "react-icons/fi";

const valueOrFallback = (value) =>
  value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);

function StatusBadge({ value, yes, no }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
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

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="group flex items-start gap-3 border-b border-slate-100 py-4 last:border-0">
      {Icon && (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-amber-50 group-hover:text-amber-600">
          <Icon size={16} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {valueOrFallback(value)}
        </p>
      </div>
    </div>
  );
}

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 sm:text-base">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <dl className="px-5 py-1 sm:px-6">{children}</dl>
    </section>
  );
}

function QuickStat({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-800">
          {value || "Not assigned"}
        </p>
      </div>
    </div>
  );
}

export default function HospitalAdminDetails({
  admin,
  hospitalName,
  branch,
  onBack,
  onEdit,
  onStatusChange,
  onDelete,
  loading = false,
}) {
  if (!admin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <FiUser className="mx-auto text-slate-300" size={36} />
        <h2 className="mt-4 font-bold text-slate-800">
          Administrator not found
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <FiArrowLeft size={16} />
          Back to Management
        </button>
      </div>
    );
  }

  const fullName =
    `${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
    admin.username ||
    "Hospital Administrator";

  const active = Boolean(admin.is_active);
  const verified = Boolean(admin.is_email_verified);
  const approved = Boolean(admin.is_approved);

  const resolvedHospitalName =
    hospitalName ||
    admin.hospital_name ||
    (typeof admin.hospital === "object" ? admin.hospital?.name : null) ||
    "Not assigned";

  const branchName =
    branch?.name ||
    branch?.branch_name ||
    admin.branch_name ||
    (typeof admin.branch === "object"
      ? admin.branch?.name || admin.branch?.branch_name
      : null) ||
    "Not assigned";

  const hospital = typeof admin.hospital === "object" ? admin.hospital : {};

  const branchData =
    branch || (typeof admin.branch === "object" ? admin.branch : {});

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div className="space-y-5 pb-8">
      {/* Heading and premium back arrow */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Hospital Admin Management"
            title="Back to Hospital Admin Management"
            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-x-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <FiArrowLeft
              size={20}
              className="transition-transform group-hover:-translate-x-0.5"
            />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">
              Hospital Admin Details
            </h1>
            {/* <p className="mt-1 text-sm text-slate-500">
              Review and manage administrator account information.
            </p> */}
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
        >
          <FiEdit size={16} />
          Edit Administrator
        </button>
      </div>

      {/* Profile banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-7 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-[35px] border-amber-400/10" />
          <div className="pointer-events-none absolute bottom-0 right-32 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br from-amber-400 to-orange-600 text-2xl font-extrabold text-white shadow-xl sm:h-24 sm:w-24">
                {admin.profile_image ? (
                  <img
                    src={admin.profile_image}
                    alt={`${fullName} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "A"
                )}
                <span
                  className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-800 ${
                    active ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold tracking-wide text-amber-300">
                    <FiShield size={12} />
                    HOSPITAL ADMIN
                  </span>
                  <span className="text-xs text-slate-400">ID: {admin.id}</span>
                </div>

                <h2 className="break-words text-2xl font-extrabold text-white sm:text-3xl">
                  {fullName}
                </h2>

                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <FiUser size={14} />@{admin.username || "No username"}
                </p>

                <p className="mt-2 flex min-w-0 items-center gap-2 break-all text-sm text-slate-400">
                  <FiMail size={14} className="shrink-0" />
                  {admin.email || "Email not provided"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge
                    value={verified}
                    yes="Email verified"
                    no="Email unverified"
                  />
                  <StatusBadge
                    value={approved}
                    yes="Approved"
                    no="Approval pending"
                  />
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-300/20 bg-rose-400/10 text-rose-200"
                    }`}
                  >
                    {active ? "Active account" : "Inactive account"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                disabled={loading || !verified}
                onClick={onStatusChange}
                title={!verified ? "Verify email before changing status" : ""}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-rose-300/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                    : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                }`}
              >
                {active ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                {active ? "Deactivate" : "Activate"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 bg-slate-50/80 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
          <QuickStat
            icon={FiHome}
            label="Assigned hospital"
            value={resolvedHospitalName}
          />
          <QuickStat
            icon={FiMapPin}
            label="Assigned branch"
            value={branchName}
          />
          <QuickStat
            icon={FiActivity}
            label="Account status"
            value={active ? "Currently active" : "Currently inactive"}
          />
        </div>
      </section>

      {/* Detail cards */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Section
          title="Personal Information"
          icon={FiUser}
        >
          <DetailRow label="Full name" value={fullName} icon={FiUser} />
          <DetailRow label="Username" value={admin.username} icon={FiHash} />
          <DetailRow label="Email address" value={admin.email} icon={FiMail} />
          <DetailRow label="Phone number" value={admin.phone} icon={FiPhone} />
          <DetailRow
            label="Account role"
            value={admin.role || "HOSPITAL_ADMIN"}
            icon={FiShield}
          />
          <DetailRow label="Administrator ID" value={admin.id} icon={FiHash} />
        </Section>

        <Section
          title="Hospital Information"
          icon={FiHome}
        >
          <DetailRow
            label="Hospital name"
            value={
              hospital.name ||
              hospital.hospital_name ||
              admin.hospital_name ||
              resolvedHospitalName
            }
            icon={FiHome}
          />
          <DetailRow
            label="Hospital ID"
            value={
              hospital.id ??
              admin.hospital_id ??
              (typeof admin.hospital === "object"
                ? admin.hospital?.id
                : admin.hospital)
            }
            icon={FiHash}
          />
          <DetailRow
            label="Hospital type"
            value={hospital.hospital_type || hospital.type}
            icon={FiShield}
          />
          <DetailRow
            label="Address"
            value={hospital.address || hospital.full_address}
            icon={FiMapPin}
          />
          <DetailRow label="City" value={hospital.city} icon={FiMapPin} />
          <DetailRow label="State" value={hospital.state} icon={FiMapPin} />
        </Section>

        <div className="xl:col-span-2">
          <Section
            title="Branch Information"
            icon={FiMapPin}
          >
            <DetailRow
              label="Branch name"
              value={branchData.name || branchData.branch_name || branchName}
              icon={FiMapPin}
            />
            <DetailRow
              label="Branch ID"
              value={
                branchData.id ??
                admin.branch_id ??
                (typeof admin.branch === "object"
                  ? admin.branch?.id
                  : admin.branch)
              }
              icon={FiHash}
            />
            <DetailRow
              label="Associated hospital"
              value={
                branchData.hospital_name ||
                hospital.name ||
                hospital.hospital_name ||
                resolvedHospitalName
              }
              icon={FiHome}
            />
            <DetailRow
              label="Branch address"
              value={branchData.address || branchData.full_address}
              icon={FiMapPin}
            />

            {!admin.branch && !admin.branch_id && (
              <div className="my-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <FiMapPin
                  className="mt-0.5 shrink-0 text-amber-700"
                  size={17}
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    No branch assigned
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Edit this administrator to assign a branch if required.
                  </p>
                </div>
              </div>
            )}
          </Section>
        </div>

        <div className="xl:col-span-2">
          <Section
            title="Account Verification"
            icon={FiShield}
          >
            <DetailRow
              label="Email verification"
              value={verified ? "Verified" : "Not verified"}
              icon={FiMail}
            />
            <DetailRow
              label="Approval status"
              value={approved ? "Approved" : "Pending approval"}
              icon={FiCheckCircle}
            />
            <DetailRow
              label="Account status"
              value={active ? "Active" : "Inactive"}
              icon={FiActivity}
            />
          </Section>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        >
          <FiArrowLeft size={16} />
          Back to Management
        </button>
      </div>
    </div>
  );
}
