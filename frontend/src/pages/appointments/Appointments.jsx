import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { appointmentService } from "../../api/service";
import { getStoredUser } from "../../api/client";
import PageHeader from "../../components/common/PageHeader";

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No Show",
};
const ACTIVE_FILTERS = [
  ["ALL", "All appointments"],
  ["PENDING", "Pending"],
  ["CONFIRMED", "Confirmed"],
  ["CHECKED_IN", "Checked in"],
  ["IN_PROGRESS", "In progress"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];
const EMPTY_FORM = {
  patient: "",
  doctor: "",
  hospital: "",
  branch: "",
  department: "",
  appointment_type: "CONSULTATION",
  scheduled_at: "",
  duration_minutes: 30,
  reason: "",
  symptoms: "",
  patient_notes: "",
};

function displayName(value) {
  return value || "—";
}
function shortAppointmentId(value) {
  if (!value) return "—";
  const normalized = String(value).replace(/[^a-zA-Z0-9]/g, "");
  return normalized.slice(0, 8).toUpperCase() || "—";
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
}
function toLocalInput(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
function statusClass(status) {
  const map = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-emerald-50 text-emerald-700",
    CHECKED_IN: "bg-sky-50 text-sky-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
    RESCHEDULED: "bg-violet-50 text-violet-700",
    NO_SHOW: "bg-gray-100 text-gray-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}
function errorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`relative max-h-[92vh] w-full ${wide ? "max-w-3xl" : "max-w-xl"} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between overflow-hidden border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <FiCalendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Appointment details and scheduling
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Close"
          >
            <FiX />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [lookups, setLookups] = useState({
    patients: [],
    doctors: [],
    hospitals: [],
    branches: [],
    departments: [],
    appointment_types: [],
  });
  const [patientContext, setPatientContext] = useState(null);
  const currentUser = getStoredUser() || {};
  const userRole = String(currentUser.role || "").toUpperCase();
  const isPatient = userRole === "PATIENT";
  const isSuperUser =
    userRole === "SUPER_USER" || Boolean(currentUser.is_superuser);
  const isHospitalAdmin = userRole === "HOSPITAL_ADMIN";
  const assignedHospitalId =
    currentUser.hospital_id || currentUser.hospital?.id || null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverCount, setServerCount] = useState(0);
  const [serverPagination, setServerPagination] = useState(false);
  const PAGE_SIZE = 5;
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadLookups = useCallback(async () => {
    try {
      const data = await appointmentService.getLookups();
      setLookups({
        patients: data?.patients || [],
        doctors: data?.doctors || [],
        hospitals: data?.hospitals || [],
        branches: data?.branches || [],
        departments: data?.departments || [],
        appointment_types: data?.appointment_types || [],
      });
      setPatientContext(data?.patient_context || null);
      if (
        currentUser.role === "HOSPITAL_ADMIN" &&
        (currentUser.hospital_id || currentUser.hospital?.id)
      ) {
        setForm((previous) => ({
          ...previous,
          hospital: String(currentUser.hospital_id || currentUser.hospital?.id),
        }));
      }
      if (currentUser.role === "PATIENT" && data?.patient_context?.id) {
        setForm((previous) => ({
          ...previous,
          patient: String(data.patient_context.id),
          hospital: String(data.patient_context.hospital_id || ""),
          branch: String(data.patient_context.branch_id || ""),
        }));
      }
    } catch (error) {
      toast.error(`Could not load appointment options: ${errorMessage(error)}`);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search.trim()) params.search = search.trim();
      if (filter !== "ALL") params.status = filter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await appointmentService.list(params);
      const result = response?.data ?? response;
      const results = Array.isArray(result)
        ? result
        : Array.isArray(result?.results)
          ? result.results
          : Array.isArray(result?.data?.results)
            ? result.data.results
            : Array.isArray(result?.data)
              ? result.data
              : [];
      const isPaginated =
        !Array.isArray(result) &&
        Array.isArray(result?.results) &&
        typeof result?.count === "number";

      setServerPagination(isPaginated);
      setServerCount(isPaginated ? result.count : results.length);
      setAppointments(results);
    } catch (error) {
      setAppointments([]);
      setServerCount(0);
      setServerPagination(false);
      toast.error(`Could not load appointments: ${errorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [search, filter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, dateFrom, dateTo]);

  useEffect(() => {
    if (modal !== "create" || (!form.branch && !form.hospital))
      return undefined;
    let cancelled = false;
    appointmentService
      .getLookups({
        ...(form.hospital ? { hospital_id: form.hospital } : {}),
        ...(form.branch ? { branch_id: form.branch } : {}),
      })
      .then((data) => {
        if (cancelled) return;
        setLookups((previous) => ({
          ...previous,
          patients: data?.patients || previous.patients,
          doctors: data?.doctors || [],
          departments: data?.departments || [],
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          setLookups((previous) => ({
            ...previous,
            doctors: [],
            departments: [],
          }));
          toast.error(
            `Could not load doctors for this branch: ${errorMessage(error)}`,
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [form.branch, form.hospital, modal]);

  const counts = useMemo(() => {
    const result = { ALL: appointments.length };
    appointments.forEach((item) => {
      result[item.status] = (result[item.status] || 0) + 1;
    });
    return result;
  }, [appointments]);

  const totalRecords = serverPagination ? serverCount : appointments.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const paginatedAppointments = useMemo(() => {
    if (serverPagination) return appointments;
    const start = (currentPage - 1) * PAGE_SIZE;
    return appointments.slice(start, start + PAGE_SIZE);
  }, [appointments, currentPage, serverPagination]);
  const paginationPages = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const selectedPatient = useMemo(() => {
    if (isPatient) return patientContext;
    return (
      lookups.patients.find(
        (item) => String(item.id) === String(form.patient),
      ) || null
    );
  }, [isPatient, patientContext, lookups.patients, form.patient]);

  const hospitalOptions = useMemo(() => {
    const supplied = lookups.hospitals || [];
    if (supplied.length) return supplied;
    const unique = new Map();
    lookups.branches.forEach((branch) => {
      if (branch.hospital_id != null) {
        unique.set(String(branch.hospital_id), {
          id: branch.hospital_id,
          name: branch.hospital_name || `Hospital ${branch.hospital_id}`,
        });
      }
    });
    return Array.from(unique.values());
  }, [lookups.hospitals, lookups.branches]);

  const selectedHospitalId = isPatient
    ? patientContext?.hospital_id || form.hospital || null
    : isHospitalAdmin
      ? assignedHospitalId
      : form.hospital || null;

  const selectedHospitalName = isPatient
    ? patientContext?.hospital_name || "Hospital not assigned"
    : hospitalOptions.find(
        (item) => String(item.id) === String(selectedHospitalId),
      )?.name ||
      lookups.branches.find(
        (item) => String(item.hospital_id) === String(selectedHospitalId),
      )?.hospital_name ||
      (isHospitalAdmin
        ? currentUser.hospital_name || currentUser.hospital?.name
        : "") ||
      (isSuperUser ? "Select a hospital first" : "Hospital not assigned");

  const visibleBranches = useMemo(() => {
    if (!selectedHospitalId) return [];
    return lookups.branches.filter(
      (item) => String(item.hospital_id) === String(selectedHospitalId),
    );
  }, [lookups.branches, selectedHospitalId]);

  const visibleDepartments = useMemo(() => {
    if (!form.branch) return [];
    return lookups.departments.filter(
      (item) => String(item.branch_id) === String(form.branch),
    );
  }, [lookups.departments, form.branch]);

  const visibleDoctors = useMemo(() => {
    if (!form.branch || !form.department) return [];
    return lookups.doctors.filter(
      (item) =>
        String(item.branch_id) === String(form.branch) &&
        String(item.department_id) === String(form.department),
    );
  }, [lookups.doctors, form.branch, form.department]);

  const visiblePatients = useMemo(() => {
    if (isPatient) return patientContext ? [patientContext] : [];
    if (!form.branch) return [];
    return lookups.patients.filter(
      (item) => String(item.branch_id) === String(form.branch),
    );
  }, [isPatient, patientContext, lookups.patients, form.branch]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      ...EMPTY_FORM,
      patient: isPatient ? String(patientContext?.id || "") : "",
      hospital: String(
        (isPatient
          ? patientContext?.hospital_id
          : isHospitalAdmin
            ? assignedHospitalId
            : "") || "",
      ),
      branch: String((isPatient ? patientContext?.branch_id : "") || ""),
      scheduled_at: toLocalInput(),
    });
    setModal("create");
  };
  const openReschedule = (appointment) => {
    setSelected(appointment);
    setForm({
      scheduled_at: toLocalInput(appointment.scheduled_at),
      duration_minutes: appointment.duration_minutes || 30,
      reason: appointment.reason || "",
    });
    setModal("reschedule");
  };
  const closeModal = () => {
    if (!saving) setModal(null);
  };
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "hospital"
        ? { branch: "", patient: "", department: "", doctor: "" }
        : {}),
      ...(name === "branch" ? { patient: "", department: "", doctor: "" } : {}),
      ...(name === "department" ? { doctor: "" } : {}),
    }));
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (
      !form.patient ||
      !form.branch ||
      !form.department ||
      !form.doctor ||
      !form.scheduled_at ||
      !form.reason.trim()
    ) {
      toast.error("Please complete all required appointment fields.");
      return;
    }
    if (new Date(form.scheduled_at).getTime() <= Date.now()) {
      toast.error("Appointment date and time must be in the future.");
      return;
    }
    if (
      !isPatient &&
      !visiblePatients.some((item) => String(item.id) === String(form.patient))
    ) {
      toast.error("Please select a patient from the selected branch.");
      return;
    }
    setSaving(true);
    try {
      const { hospital: _hospitalId, ...appointmentFields } = form;
      const payload = {
        ...appointmentFields,
        patient: Number(form.patient),
        doctor: Number(form.doctor),
        branch: Number(form.branch),
        department: form.department ? Number(form.department) : null,
        duration_minutes: Number(form.duration_minutes),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      };
      await appointmentService.create(payload);
      toast.success("Appointment created successfully.");
      setModal(null);
      await loadAppointments();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submitReschedule = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await appointmentService.reschedule(selected.id, {
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        reason: form.reason,
      });
      toast.success("Appointment rescheduled successfully.");
      setModal(null);
      await loadAppointments();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointment) => {
    const reason = window.prompt("Optional cancellation reason:", "");
    if (reason === null) return;
    try {
      await appointmentService.cancel(appointment.id, { reason });
      toast.success("Appointment cancelled.");
      await loadAppointments();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const updateStatus = async (appointment, nextStatus) => {
    try {
      await appointmentService.updateStatus(appointment.id, {
        status: nextStatus,
      });
      toast.success(
        `Appointment marked ${STATUS_LABELS[nextStatus]?.toLowerCase() || nextStatus}.`,
      );
      await loadAppointments();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const exportCsv = () => {
    if (!appointments.length) {
      toast.error("There are no appointments to export.");
      return;
    }
    const columns = [
      "appointment_number",
      "patient_name",
      "doctor_name",
      "hospital_name",
      "branch_name",
      "department_name",
      "scheduled_at",
      "appointment_type",
      "status",
      "reason",
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      columns.join(","),
      ...appointments.map((item) =>
        columns.map((key) => escapeCsv(item[key])).join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medicore-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const canCancel = (item) =>
    !["CANCELLED", "COMPLETED", "RESCHEDULED", "NO_SHOW"].includes(item.status);
  const nextStatus = (item) =>
    ({
      PENDING: "CONFIRMED",
      CONFIRMED: "CHECKED_IN",
      CHECKED_IN: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
    })[item.status];

  return (
    <div className="space-y-6 text-slate-700">
      <PageHeader
        title="Appointment Management"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FiDownload /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                loadAppointments();
                loadLookups();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FiRefreshCw /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-amber-600 hover:to-orange-700 hover:shadow-xl"
            >
              <FiPlus
                size={17}
                className="transition-transform duration-300 group-hover:rotate-90"
              />{" "}
              New Appointment
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total appointments", appointments.length, "slate"],
          ["Confirmed", counts.CONFIRMED || 0, "emerald"],
          ["In progress", counts.IN_PROGRESS || 0, "blue"],
          ["Pending", counts.PENDING || 0, "amber"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${color === "amber" ? "bg-amber-500/15" : color === "emerald" ? "bg-emerald-500/10" : color === "blue" ? "bg-blue-500/10" : "bg-indigo-500/10"}`}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                  {value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${color === "amber" ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20" : color === "emerald" ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20" : color === "blue" ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20" : "bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-500/20"}`}
              >
                {color === "amber" ? (
                  <FiClock size={21} />
                ) : color === "emerald" ? (
                  <FiCalendar size={21} />
                ) : color === "blue" ? (
                  <FiRefreshCw size={21} />
                ) : (
                  <FiPlus size={21} />
                )}
              </div>
            </div>
            <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full w-1/3 rounded-full ${color === "amber" ? "bg-gradient-to-r from-amber-500 to-orange-500" : color === "emerald" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : color === "blue" ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-slate-500 to-slate-700"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                <FiCalendar size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Appointment Records
                </h2>
                <p className="mt-0.5 text-sm text-slate-500"></p>
              </div>
            </div>
            <span className="w-fit rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {appointments.length} loaded
            </span>
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-9`}
                placeholder="Search patient, doctor, reason or ID..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>From date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>To date</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                className="self-end rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 pb-4">
            {ACTIVE_FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${filter === key ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20" : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"}`}
              >
                {label}
                {key === "ALL"
                  ? ` (${appointments.length})`
                  : counts[key]
                    ? ` (${counts[key]})`
                    : ""}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-gradient-to-r from-slate-50 via-white to-amber-50/60">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Appointment</th>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Doctor</th>
                  <th className="px-5 py-4">Hospital</th>
                  <th className="px-5 py-4">Branch</th>
                  <th className="px-5 py-4">Date & time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      Loading appointments from server…
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <FiCalendar size={22} />
                      </div>
                      <p className="mt-3 font-bold text-slate-800">
                        No appointments found
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Try changing the filters or create a new appointment.
                      </p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:from-amber-600 hover:to-orange-700"
                      >
                        Create appointment
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedAppointments.map((item) => (
                    <tr
                      key={item.id}
                      className="align-top transition-colors duration-200 hover:bg-amber-50/60"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-amber-700">
                          {shortAppointmentId(
                            item.appointment_number || item.id,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {item.appointment_type?.replaceAll("_", " ") ||
                            "CONSULTATION"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {displayName(item.patient_name)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.patient_number
                            ? String(item.patient_number).slice(0, 8)
                            : "Patient record"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {displayName(item.doctor_name)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.doctor_email || "Doctor"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {displayName(
                            item.hospital_name ||
                              item.hospital?.name ||
                              item.hospital?.hospital_name ||
                              item.hospital?.title ||
                              hospitalOptions.find(
                                (hospital) =>
                                  String(hospital.id) ===
                                  String(
                                    item.hospital_id ??
                                      item.hospital?.id ??
                                      item.hospital,
                                  ),
                              )?.name ||
                              lookups.branches.find(
                                (branch) =>
                                  String(branch.id) ===
                                  String(
                                    item.branch_id ??
                                      item.branch?.id ??
                                      item.branch,
                                  ),
                              )?.hospital_name,
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {displayName(item.branch_name)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.department_name || "General"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-sm text-gray-800">
                          <FiCalendar className="text-slate-400" />
                          {formatDate(item.scheduled_at)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <FiClock />
                          {formatTime(item.scheduled_at)} ·{" "}
                          {item.duration_minutes || 30} min
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[132px] flex-wrap items-center gap-2">
                          {![
                            "COMPLETED",
                            "CANCELLED",
                            "RESCHEDULED",
                            "NO_SHOW",
                          ].includes(item.status) && (
                            <button
                              type="button"
                              title="Reschedule appointment"
                              aria-label="Reschedule appointment"
                              onClick={() => openReschedule(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          )}
                          {nextStatus(item) && (
                            <button
                              type="button"
                              title={`Mark ${STATUS_LABELS[nextStatus(item)]}`}
                              aria-label={`Mark ${STATUS_LABELS[nextStatus(item)]}`}
                              onClick={() =>
                                updateStatus(item, nextStatus(item))
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"
                            >
                              <FiCheckCircle size={16} />
                            </button>
                          )}
                          {canCancel(item) && (
                            <button
                              type="button"
                              title="Cancel appointment"
                              aria-label="Cancel appointment"
                              onClick={() => cancelAppointment(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm"
                            >
                              <FiXCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {totalRecords === 0
                ? "No appointments to display"
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    currentPage * PAGE_SIZE,
                    totalRecords,
                  )} of ${totalRecords} appointments`}
              {serverPagination
                ? ` · Page ${currentPage} of ${totalPages}`
                : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft size={16} /> Previous
              </button>
              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-current={currentPage === page ? "page" : undefined}
                  disabled={loading}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 min-w-9 rounded-xl px-3 text-sm font-bold transition ${
                    currentPage === page
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal === "create" && (
        <Modal title="Create new appointment" onClose={closeModal} wide>
          <form onSubmit={submitCreate} className="space-y-6">
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/70 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Hospital *</label>
                  {isSuperUser ? (
                    <select
                      name="hospital"
                      required
                      value={form.hospital}
                      onChange={updateField}
                      className={inputClass}
                    >
                      <option value="">Select hospital</option>
                      {hospitalOptions.map((hospital) => (
                        <option key={hospital.id} value={hospital.id}>
                          {hospital.name || hospital.hospital_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={selectedHospitalName}
                      readOnly
                      className={`${inputClass} bg-gray-50`}
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Branch *</label>
                  <select
                    name="branch"
                    required
                    value={form.branch}
                    onChange={updateField}
                    disabled={!selectedHospitalId}
                    className={inputClass}
                  >
                    <option value="">
                      {selectedHospitalId
                        ? "Select branch"
                        : "Select hospital first"}
                    </option>
                    {visibleBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!isPatient && (
                  <div>
                    <label className={labelClass}>Patient *</label>
                    <select
                      name="patient"
                      required
                      value={form.patient}
                      onChange={updateField}
                      disabled={!form.branch}
                      className={inputClass}
                    >
                      <option value="">
                        {form.branch ? "Select patient" : "Select branch first"}
                      </option>
                      {visiblePatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.mobile_number ? ` · ${p.mobile_number}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {isPatient && (
                  <div>
                    <label className={labelClass}>Patient</label>
                    <input
                      value={
                        patientContext?.name ||
                        currentUser.username ||
                        "Your patient profile"
                      }
                      readOnly
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Department *</label>
                  <select
                    name="department"
                    required
                    value={form.department}
                    onChange={updateField}
                    disabled={!form.branch}
                    className={inputClass}
                  >
                    <option value="">
                      {form.branch
                        ? "Select department"
                        : "Select branch first"}
                    </option>
                    {visibleDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Doctor *</label>
                  <select
                    name="doctor"
                    required
                    value={form.doctor}
                    onChange={updateField}
                    disabled={!form.branch || !form.department}
                    className={inputClass}
                  >
                    <option value="">
                      {!form.branch
                        ? "Select branch first"
                        : !form.department
                          ? "Select department first"
                          : visibleDoctors.length
                            ? "Select doctor"
                            : "No doctors assigned to this department"}
                    </option>
                    {visibleDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Appointment type *</label>
                  <select
                    name="appointment_type"
                    required
                    value={form.appointment_type}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {(lookups.appointment_types.length
                      ? lookups.appointment_types
                      : [
                          { value: "CONSULTATION", label: "Consultation" },
                          { value: "FOLLOW_UP", label: "Follow-up" },
                          { value: "EMERGENCY", label: "Emergency" },
                          {
                            value: "TELECONSULTATION",
                            label: "Teleconsultation",
                          },
                        ]
                    ).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date & time *</label>
                  <input
                    name="scheduled_at"
                    type="datetime-local"
                    required
                    min={toLocalInput(new Date(Date.now() + 60 * 1000))}
                    value={form.scheduled_at}
                    onChange={updateField}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Duration (minutes) *</label>
                  <select
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {[15, 20, 30, 45, 60, 90, 120].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Reason for visit *</label>
                  <input
                    name="reason"
                    required
                    maxLength={255}
                    value={form.reason}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. General consultation"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Symptoms</label>
                <textarea
                  name="symptoms"
                  rows="2"
                  value={form.symptoms}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Patient symptoms (optional)"
                />
              </div>
              <div>
                <label className={labelClass}>Patient notes</label>
                <textarea
                  name="patient_notes"
                  rows="2"
                  value={form.patient_notes}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Additional information (optional)"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                disabled={saving}
              >
                Close
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving…" : "Create appointment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "reschedule" && selected && (
        <Modal
          title={`Reschedule ${String(selected.appointment_number || selected.id).slice(0, 12)}`}
          onClose={closeModal}
        >
          <form onSubmit={submitReschedule} className="space-y-4">
            <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-sm">
              <p className="font-bold text-slate-800">
                {selected.patient_name} with {selected.doctor_name}
              </p>
              <p className="mt-1 text-slate-500">
                Current: {formatDate(selected.scheduled_at)} at{" "}
                {formatTime(selected.scheduled_at)}
              </p>
            </div>
            <div>
              <label className={labelClass}>New date & time *</label>
              <input
                name="scheduled_at"
                type="datetime-local"
                required
                min={toLocalInput(new Date(Date.now() + 60 * 1000))}
                value={form.scheduled_at}
                onChange={updateField}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Duration (minutes)</label>
              <select
                name="duration_minutes"
                value={form.duration_minutes}
                onChange={updateField}
                className={inputClass}
              >
                {[15, 20, 30, 45, 60, 90, 120].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Reason</label>
              <input
                name="reason"
                value={form.reason}
                onChange={updateField}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                disabled={saving}
              >
                Close
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Rescheduling…" : "Confirm reschedule"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
