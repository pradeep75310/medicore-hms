import React, { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiPhone,
  FiMail,
  FiMapPin,
  FiX,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPower,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiMoreVertical,
  FiUsers,
  FiActivity,
  FiCalendar,
  FiArrowLeft,
  FiChevronRight,
  FiRefreshCw,
  FiBriefcase,
  FiUser,
  FiLayers,
  FiHash,
  FiGlobe,
} from "react-icons/fi";

import {
  HiOutlineShieldCheck,
  HiOutlineBuildingLibrary,
  HiOutlineHeart,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingOffice,
} from "react-icons/hi2";

import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";

import { hospitalApi, dashboardApi } from "../../api/service";

/* =========================================================
   CONSTANTS
========================================================= */

const emptyForm = {
  name: "",
  legalName: "",
  hospitalCode: "",
  hospitalType: "PRIVATE",
  registrationNumber: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postal_Code: "",
  status: "ACTIVE",
};

/* =========================================================
   HELPERS
========================================================= */

const unwrap = (payload) => {
  if (payload?.data !== undefined) {
    return payload.data;
  }

  return payload;
};

const normalizeList = (payload) => {
  const root = unwrap(payload);

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root?.results)) {
    return root.results;
  }

  if (Array.isArray(root?.data)) {
    return root.data;
  }

  if (Array.isArray(root?.data?.results)) {
    return root.data.results;
  }

  return [];
};

const getValue = (object, keys, fallback = "") => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const getHospitalReference = (item) => {
  return (
    item?.hospital_id ??
    item?.hospitalId ??
    item?.hospital?.id ??
    item?.hospital?.pk ??
    item?.user?.hospital_id ??
    item?.user?.hospital?.id ??
    null
  );
};

const filterHospitalItems = (items, hospitalId) => {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }

  const hasHospitalReference = items.some(
    (item) => getHospitalReference(item) !== null,
  );

  if (!hasHospitalReference) {
    return items;
  }

  return items.filter(
    (item) => String(getHospitalReference(item)) === String(hospitalId),
  );
};

/* =========================================================
   LOGO HELPERS
========================================================= */

const resolveLogoUrl = (logo) => {
  if (!logo) return "";

  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("data:")
  ) {
    return logo;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "";

  try {
    if (apiUrl) {
      const apiOrigin = new URL(apiUrl).origin;

      if (logo.startsWith("/")) {
        return `${apiOrigin}${logo}`;
      }

      return `${apiOrigin}/${logo}`;
    }
  } catch {
    // fallback below
  }

  if (logo.startsWith("/")) {
    return `${window.location.origin}${logo}`;
  }

  return `${window.location.origin}/${logo}`;
};

const getHospitalLogo = (hospital) => {
  const logo = getValue(hospital, [
    "logo_url",
    "logo",
    "hospital_logo",
    "image_url",
    "image",
    "profile_image",
    "profile_image_url",
  ]);

  return resolveLogoUrl(logo);
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);

  const [editingHospital, setEditingHospital] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [showProfile, setShowProfile] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  /* =========================================================
     LOAD HOSPITALS
  ========================================================= */

  const loadHospitals = async () => {
    setLoadingHospitals(true);

    try {
      const response = await dashboardApi.hospitals();

      const list = normalizeList(response);

      setHospitals(list);
    } catch (error) {
      console.error("Failed to load hospitals:", error);

      toast.error(error?.message || "Unable to load hospitals from server.");

      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  /* =========================================================
     FORM
  ========================================================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "hospitalCode" ? value.toUpperCase() : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const openCreateModal = () => {
    setEditingHospital(null);
    setFormData({ ...emptyForm });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (hospital) => {
    setEditingHospital(hospital);

    setFormData({
      name: hospital?.name || "",
      legalName: hospital?.legal_name || "",
      hospitalCode: hospital?.hospital_code || "",
      hospitalType: hospital?.hospital_type || "PRIVATE",
      registrationNumber: hospital?.registration_number || "",
      email: hospital?.email || "",
      phone: hospital?.phone || "",
      addressLine1: hospital?.address_line_1 || hospital?.addressLine1 || "",
      city: hospital?.city || "",
      state: hospital?.state || "",
      postal_Code: hospital?.postal_code || hospital?.postal_Code || "",
      status: hospital?.status || "ACTIVE",
    });

    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (loading) return;

    setShowModal(false);
    setEditingHospital(null);
    setErrors({});
    setFormData({ ...emptyForm });
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const nextErrors = {};

    const name = formData.name.trim();
    const code = formData.hospitalCode.trim().toUpperCase();
    const email = formData.email.trim();
    const phone = formData.phone.replace(/[^0-9]/g, "");
    const city = formData.city.trim();
    const state = formData.state.trim();
    const pincode = formData.postal_Code.trim();

    if (!name) {
      nextErrors.name = "Hospital name is required.";
    } else if (name.length < 2) {
      nextErrors.name = "Hospital name must contain at least 2 characters.";
    }

    if (!code) {
      nextErrors.hospitalCode = "Hospital code is required.";
    } else if (code.length < 3 || code.length > 30) {
      nextErrors.hospitalCode = "Hospital code must be 3–30 characters.";
    } else if (!/^[A-Z0-9-]+$/.test(code)) {
      nextErrors.hospitalCode =
        "Only letters, numbers and hyphens are allowed.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (phone && (phone.length < 10 || phone.length > 15)) {
      nextErrors.phone = "Phone number must contain 10–15 digits.";
    }

    if (city && city.length < 2) {
      nextErrors.city = "City must contain at least 2 characters.";
    }

    if (state && state.length < 2) {
      nextErrors.state = "State must contain at least 2 characters.";
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      nextErrors.postal_Code = "Pincode must contain exactly 6 digits.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return false;
    }

    return true;
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      name: formData.name.trim(),

      legal_name: formData.legalName.trim(),

      hospital_code: formData.hospitalCode.trim().toUpperCase(),

      hospital_type: formData.hospitalType,

      registration_number: formData.registrationNumber.trim().toUpperCase(),

      email: formData.email.trim(),

      phone: formData.phone.replace(/[^0-9]/g, ""),

      address_line_1: formData.addressLine1.trim(),

      city: formData.city.trim(),

      state: formData.state.trim(),

      postal_code: formData.postal_Code.trim(),

      status: formData.status,
    };

    try {
      if (editingHospital) {
        const result = await hospitalApi.update(editingHospital.id, payload);

        const updatedHospital = unwrap(result);

        setHospitals((prev) =>
          prev.map((hospital) =>
            hospital.id === editingHospital.id
              ? {
                  ...hospital,
                  ...updatedHospital,
                }
              : hospital,
          ),
        );

        if (selectedHospital?.id === editingHospital.id) {
          setSelectedHospital((prev) => ({
            ...prev,
            ...updatedHospital,
          }));
        }

        toast.success("Hospital updated successfully.");
      } else {
        const result = await hospitalApi.create(payload);

        const newHospital = unwrap(result);

        setHospitals((prev) => [newHospital, ...prev]);

        toast.success("Hospital registered successfully.");
      }

      closeModal();
    } catch (error) {
      console.error("Hospital save error:", error);

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${editingHospital ? "update" : "register"} hospital.`,
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const handleStatusChange = async (hospital) => {
    const isActive = hospital.status === "ACTIVE";

    const nextStatus = isActive ? "INACTIVE" : "ACTIVE";

    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${hospital.name}"?`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await hospitalApi.update(hospital.id, {
        status: nextStatus,
      });

      const updatedHospital = unwrap(result);

      setHospitals((prev) =>
        prev.map((item) =>
          item.id === hospital.id
            ? {
                ...item,
                ...updatedHospital,
                status: updatedHospital?.status || nextStatus,
              }
            : item,
        ),
      );

      setSelectedHospital((prev) =>
        prev?.id === hospital.id
          ? {
              ...prev,
              ...updatedHospital,
              status: updatedHospital?.status || nextStatus,
            }
          : prev,
      );

      toast.success(`Hospital ${action}d successfully.`);
    } catch (error) {
      console.error(error);

      toast.error(error?.message || `Failed to ${action} hospital.`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (hospital) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${hospital.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      await hospitalApi.remove(hospital.id);

      setHospitals((prev) => prev.filter((item) => item.id !== hospital.id));

      if (selectedHospital?.id === hospital.id) {
        setSelectedHospital(null);
        setShowProfile(false);
      }

      toast.success("Hospital deleted successfully.");
    } catch (error) {
      console.error(error);

      toast.error(error?.message || "Failed to delete hospital.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     OPEN PROFILE
  ========================================================= */

  const openProfile = (hospital) => {
    setSelectedHospital(hospital);
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
    setSelectedHospital(null);
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredHospitals = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      const matchSearch =
        !searchValue ||
        hospital?.name?.toLowerCase().includes(searchValue) ||
        hospital?.hospital_code?.toLowerCase().includes(searchValue) ||
        hospital?.city?.toLowerCase().includes(searchValue) ||
        hospital?.state?.toLowerCase().includes(searchValue);

      const matchType =
        typeFilter === "ALL" || hospital?.hospital_type === typeFilter;

      return matchSearch && matchType;
    });
  }, [hospitals, search, typeFilter]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalHospitals = hospitals.length;

  const activeHospitals = hospitals.filter((h) => h.status === "ACTIVE").length;

  const inactiveHospitals = hospitals.filter(
    (h) => h.status !== "ACTIVE",
  ).length;

  const privateHospitals = hospitals.filter(
    (h) => h.hospital_type === "PRIVATE",
  ).length;

  const govermentHospitals = hospitals.filter(
    (h) => h.hospital_type === "GOVERNMENT",
  ).length;

  const trustHospitals = hospitals.filter(
    (h) => h.hospital_type === "TRUST",
  ).length;

  const corporateHospitals = hospitals.filter(
    (h) => h.hospital_type === "CORPORATE",
  ).length;

  const otherHospitals = hospitals.filter(
    (h) => h.hospital_type === "OTHER",
  ).length;

  /* =========================================================
     PROFILE PAGE
  ========================================================= */

  if (showProfile && selectedHospital) {
    return (
      <HospitalProfile
        hospital={selectedHospital}
        onBack={closeProfile}
        onEdit={openEditModal}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Hospital Management"
        action={
          <button
            onClick={openCreateModal}
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <FiPlus size={17} className="transition group-hover:rotate-90" />
            Register Hospital
          </button>
        }
      />

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Hospitals"
          value={totalHospitals}
          description="Registered facilities"
          icon={FiHome}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Active Facilities"
          value={activeHospitals}
          description="Currently operational"
          icon={FiCheckCircle}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive Facilities"
          value={inactiveHospitals}
          description="Currently Unavailable"
          icon={FiClock}
          iconClass="bg-rose-50 text-rose-600"
        />

        <StatCard
          title="Private Facilities"
          value={privateHospitals}
          description="Private hospitals"
          icon={HiOutlineShieldCheck}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Government Facilities"
          value={govermentHospitals}
          description="Government hospitals"
          icon={HiOutlineBuildingLibrary}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Trust Facilities"
          value={trustHospitals}
          description="Trust hospitals"
          icon={HiOutlineHeart}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Corporate Facilities"
          value={corporateHospitals}
          description="Corporate hospitals"
          icon={HiOutlineBuildingOffice2}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Other Facilities"
          value={otherHospitals}
          description="other hospitals"
          icon={HiOutlineBuildingOffice}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* =====================================================
          MAIN TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}

        <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <h3 className="text-lg font-bold tracking-tight text-slate-800">
                  Registered Healthcare Organizations
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}

              <div className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 sm:w-[310px]">
                <FiSearch size={16} className="shrink-0 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search hospital..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ml-2 w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <FiX size={15} />
                  </button>
                )}
              </div>

              {/* Filter */}

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 min-w-[155px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="ALL">All Types</option>

                <option value="PRIVATE">Private</option>

                <option value="GOVERNMENT">Government</option>

                <option value="TRUST">Trust</option>

                <option value="CORPORATE">Corporate</option>
              </select>

              <button
                type="button"
                onClick={loadHospitals}
                disabled={loadingHospitals}
                title="Refresh hospitals"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
              >
                <FiRefreshCw
                  size={16}
                  className={loadingHospitals ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                {[
                  "Hospital",
                  "Type",
                  "Location",
                  "Contact",
                  "Status",
                  "Actions",
                ].map((heading, index) => (
                  <th
                    key={heading}
                    className={`px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ${
                      index === 5 ? "text-right" : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingHospitals ? (
                <HospitalTableSkeleton />
              ) : (
                filteredHospitals.map((hospital) => {
                  const active = hospital.status === "ACTIVE";

                  const logo = getHospitalLogo(hospital);

                  return (
                    <tr
                      key={hospital.id || hospital.hospital_code}
                      className="group transition hover:bg-amber-50/30"
                    >
                      {/* Hospital */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <HospitalLogo
                            src={logo}
                            name={hospital.name}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <div className="max-w-[280px] truncate text-sm font-bold text-slate-800">
                              {hospital.name || "Unnamed Hospital"}
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                                {hospital.hospital_code || "NO-CODE"}
                              </span>
                            </div>

                            {hospital.legal_name && (
                              <div className="mt-1 max-w-[280px] truncate text-[11px] text-slate-400">
                                {hospital.legal_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {hospital.hospital_type || "—"}
                        </span>
                      </td>

                      {/* Location */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiMapPin size={14} className="text-amber-500" />

                          <span>
                            {hospital.city
                              ? `${hospital.city}${
                                  hospital.state ? `, ${hospital.state}` : ""
                                }`
                              : "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}

                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          {hospital.email && (
                            <div className="flex max-w-[210px] items-center gap-2 text-xs text-slate-600">
                              <FiMail
                                size={12}
                                className="shrink-0 text-slate-400"
                              />

                              <span className="truncate">{hospital.email}</span>
                            </div>
                          )}

                          {hospital.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <FiPhone
                                size={12}
                                className="shrink-0 text-slate-400"
                              />

                              {hospital.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                            active
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-rose-100 bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />

                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            title="View Hospital Profile"
                            onClick={() => openProfile(hospital)}
                            className="text-indigo-600 hover:bg-indigo-50"
                          >
                            <FiEye size={15} />
                          </ActionButton>

                          <ActionButton
                            title="Edit Hospital"
                            onClick={() => openEditModal(hospital)}
                            className="text-slate-600 hover:bg-slate-100"
                          >
                            <FiEdit2 size={15} />
                          </ActionButton>

                          <ActionButton
                            title={
                              active
                                ? "Deactivate Hospital"
                                : "Activate Hospital"
                            }
                            disabled={loading}
                            onClick={() => handleStatusChange(hospital)}
                            className={
                              active
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }
                          >
                            <FiPower size={15} />
                          </ActionButton>

                          <ActionButton
                            title="Delete Hospital"
                            disabled={loading}
                            onClick={() => handleDelete(hospital)}
                            className="text-rose-500 hover:bg-rose-50"
                          >
                            <FiTrash2 size={15} />
                          </ActionButton>

                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            title="More actions"
                          >
                            <FiMoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loadingHospitals && filteredHospitals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FiHome size={27} />
                      </div>

                      <p className="font-bold text-slate-700">
                        No hospitals found
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Try changing your search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredHospitals.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">{hospitals.length}</span>{" "}
            hospitals
          </p>
        </div>
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 px-4 py-5 backdrop-blur-sm sm:py-8">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
              {/* Modal Header */}

              <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                    {editingHospital ? (
                      <FiEdit2 size={18} />
                    ) : (
                      <FiHome size={19} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-800 sm:text-xl">
                      {editingHospital
                        ? "Edit Hospital"
                        : "Onboard New Hospital"}
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {editingHospital
                        ? "Update hospital organization details."
                        : "Register a new healthcare organization."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <FiX size={19} />
                </button>
              </div>

              {/* =================================================
                  SCROLLABLE FORM BODY
              ================================================= */}

              <div className="max-h-[calc(100vh-180px)] overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
                  {/* Organization */}

                  <FormSection
                    title="Organization Information"
                    subtitle="Basic identity and registration details"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        label="Hospital Name"
                        required
                        error={errors.name}
                      >
                        <input
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Fortis Healthcare"
                          className={inputClass(errors.name)}
                        />
                      </FormField>

                      <FormField
                        label="Hospital Code"
                        required
                        error={errors.hospitalCode}
                      >
                        <input
                          required
                          name="hospitalCode"
                          value={formData.hospitalCode}
                          onChange={handleInputChange}
                          placeholder="e.g. FORTIS-BLR"
                          className={`${inputClass(
                            errors.hospitalCode,
                          )} uppercase`}
                        />
                      </FormField>

                      <FormField label="Legal Entity Name">
                        <input
                          name="legalName"
                          value={formData.legalName}
                          onChange={handleInputChange}
                          placeholder="Registered legal corporate name"
                          className={inputClass()}
                        />
                      </FormField>

                      <FormField label="Hospital Type">
                        <select
                          name="hospitalType"
                          value={formData.hospitalType}
                          onChange={handleInputChange}
                          className={inputClass()}
                        >
                          <option value="PRIVATE">Private</option>

                          <option value="GOVERNMENT">Government</option>

                          <option value="TRUST">Trust</option>

                          <option value="CORPORATE">Corporate</option>
                        </select>
                      </FormField>

                      <FormField label="Registration Number">
                        <input
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          placeholder="Registration number"
                          className={inputClass()}
                        />
                      </FormField>

                      <FormField label="Official Email" error={errors.email}>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="admin@hospital.com"
                          className={inputClass(errors.email)}
                        />
                      </FormField>

                      <FormField label="Contact Phone" error={errors.phone}>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 XXXXX XXXXX"
                          className={inputClass(errors.phone)}
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* Location */}

                  <FormSection
                    title="Location Information"
                    subtitle="Hospital address and geographic details"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <FormField label="Address">
                          <input
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleInputChange}
                            placeholder="Street / Campus address"
                            className={inputClass()}
                          />
                        </FormField>
                      </div>

                      <FormField label="City" error={errors.city}>
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className={inputClass(errors.city)}
                        />
                      </FormField>

                      <FormField label="State" error={errors.state}>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          className={inputClass(errors.state)}
                        />
                      </FormField>

                      <FormField label="Pincode" error={errors.postal_Code}>
                        <input
                          name="postal_Code"
                          value={formData.postal_Code}
                          onChange={handleInputChange}
                          placeholder="6 digit pincode"
                          inputMode="numeric"
                          maxLength={6}
                          className={inputClass(errors.postal_Code)}
                        />
                      </FormField>

                      {editingHospital && (
                        <FormField label="Status">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className={inputClass()}
                          >
                            <option value="ACTIVE">Active</option>

                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </FormField>
                      )}
                    </div>
                  </FormSection>

                  {/* Bottom action area */}

                  <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 p-5 backdrop-blur-xl sm:-mx-7 sm:-mb-7 sm:flex-row sm:justify-end sm:px-7 sm:py-5">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={16} />

                          {editingHospital
                            ? "Update Hospital"
                            : "Save Hospital"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HOSPITAL PROFILE
========================================================= */

function HospitalProfile({
  hospital,
  onBack,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  const [profile, setProfile] = useState(hospital);

  const [profileLoading, setProfileLoading] = useState(true);

  const [profileError, setProfileError] = useState("");

  const [section, setSection] = useState("overview");

  const [search, setSearch] = useState("");

  const [lists, setLists] = useState({
    branches: [],
    doctors: [],
    nurses: [],
    staff: [],
    patients: [],
    appointments: [],
    departments: [],
  });

  const [listLoading, setListLoading] = useState(false);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await hospitalApi.get(hospital.id);

      const detail = unwrap(response);

      if (detail && typeof detail === "object") {
        setProfile({
          ...hospital,
          ...detail,
        });
      } else {
        setProfile(hospital);
      }
    } catch (error) {
      console.error("Hospital profile error:", error);

      setProfile(hospital);

      setProfileError(
        error?.message || "Some profile details could not be loaded.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  /* =========================================================
     LOAD ALL HOSPITAL DATA
  ========================================================= */

  const loadHospitalLists = async () => {
    setListLoading(true);

    try {
      const hospitalId = hospital.id;

      const results = await Promise.allSettled([
        dashboardApi.branches({
          hospital: hospitalId,
        }),

        dashboardApi.doctors({
          hospital: hospitalId,
        }),

        dashboardApi.nurses({
          hospital: hospitalId,
        }),

        dashboardApi.staff({
          hospital: hospitalId,
        }),

        dashboardApi.patients({
          hospital: hospitalId,
        }),

        dashboardApi.appointments({
          hospital: hospitalId,
        }),

        dashboardApi.departments({
          hospital: hospitalId,
        }),
      ]);

      const names = [
        "branches",
        "doctors",
        "nurses",
        "staff",
        "patients",
        "appointments",
        "departments",
      ];

      const nextLists = {};

      names.forEach((name, index) => {
        const result = results[index];

        if (result.status === "fulfilled") {
          const items = normalizeList(result.value);

          nextLists[name] = filterHospitalItems(items, hospitalId);
        } else {
          console.error(`${name} API failed:`, result.reason);

          nextLists[name] = [];
        }
      });

      setLists(nextLists);
    } catch (error) {
      console.error("Hospital lists error:", error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadHospitalLists();
  }, [hospital.id]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = {
    branches: getValue(
      profile,
      ["branches_count", "branch_count", "branchesCount"],
      lists.branches.length,
    ),

    doctors: getValue(
      profile,
      ["doctors_count", "doctor_count", "doctorsCount"],
      lists.doctors.length,
    ),

    nurses: getValue(
      profile,
      ["nurses_count", "nurse_count", "nursesCount"],
      lists.nurses.length,
    ),

    staff: getValue(profile, ["staff_count", "staffCount"], lists.staff.length),

    patients: getValue(
      profile,
      ["patients_count", "patient_count", "patientsCount"],
      lists.patients.length,
    ),

    appointments: getValue(
      profile,
      ["appointments_count", "appointment_count", "appointmentsCount"],
      lists.appointments.length,
    ),

    departments: getValue(
      profile,
      ["departments_count", "department_count", "departmentsCount"],
      lists.departments.length,
    ),
  };

  /* =========================================================
     FILTER CURRENT LIST
  ========================================================= */

  const currentItems = useMemo(() => {
    if (section === "overview") return [];

    const source = lists[section] || [];

    const query = search.trim().toLowerCase();

    if (!query) return source;

    return source.filter((item) => {
      const values = [
        item?.name,
        item?.full_name,
        item?.first_name,
        item?.last_name,
        item?.email,
        item?.phone,
        item?.code,
        item?.hospital_code,
        item?.doctor_name,
        item?.patient_name,
        item?.username,
        item?.department_name,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [section, search, lists]);

  const logo = getHospitalLogo(profile);

  const active = profile.status === "ACTIVE";

  /* =========================================================
     PROFILE
  ========================================================= */

  return (
    <div className="min-h-screen space-y-6 pb-10">
      {/* =====================================================
          TOP NAV
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={
            section !== "overview"
              ? () => {
                  setSection("overview");
                  setSearch("");
                }
              : onBack
          }
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        >
          <FiArrowLeft
            size={16}
            className="transition group-hover:-translate-x-0.5"
          />

          {section !== "overview" ? "Back to Profile" : "Back to Hospitals"}
        </button>

        <button
          type="button"
          onClick={() => {
            loadProfile();
            loadHospitalLists();
          }}
          disabled={profileLoading || listLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw
            size={15}
            className={profileLoading || listLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* =====================================================
          PROFILE HERO
      ===================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* decorative */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            {/* Identity */}

            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <HospitalLogo src={logo} name={profile.name} size="lg" />

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      active
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-rose-100 bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />

                    {active ? "Active" : "Inactive"}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {profile.hospital_type || "Healthcare Facility"}
                  </span>
                </div>

                <h1 className="max-w-3xl text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {profile.name || "Hospital Profile"}
                </h1>

                {profile.legal_name && (
                  <p className="mt-1.5 text-sm font-medium text-slate-500">
                    {profile.legal_name}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {profile.hospital_code && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-700">
                      <FiHash size={12} />
                      {profile.hospital_code}
                    </span>
                  )}

                  {(profile.city || profile.state) && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                      <FiMapPin size={12} />
                      {profile.city}
                      {profile.state ? `, ${profile.state}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => onEdit(profile)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FiEdit2 size={15} />
                Edit
              </button>

              <button
                type="button"
                disabled={profileLoading}
                onClick={() => onStatusChange(profile)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition ${
                  active
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <FiPower size={15} />

                {active ? "Deactivate" : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => onDelete(profile)}
                className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-transparent" />
      </div>

      {/* Error */}

      {profileError && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {profileError}
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProfileStatCard
          title="Branches"
          value={counts.branches}
          description="Hospital locations"
          icon={FiLayers}
          iconClass="bg-indigo-50 text-indigo-600"
          onClick={() => setSection("branches")}
        />

        <ProfileStatCard
          title="Doctors"
          value={counts.doctors}
          description="Medical professionals"
          icon={FiUser}
          iconClass="bg-blue-50 text-blue-600"
          onClick={() => setSection("doctors")}
        />

        <ProfileStatCard
          title="Nurses"
          value={counts.nurses}
          description="Nursing staff"
          icon={UsersIcon}
          iconClass="bg-pink-50 text-pink-600"
          onClick={() => setSection("nurses")}
        />

        <ProfileStatCard
          title="Staff"
          value={counts.staff}
          description="Organization staff"
          icon={FiUsers}
          iconClass="bg-violet-50 text-violet-600"
          onClick={() => setSection("staff")}
        />

        <ProfileStatCard
          title="Patients"
          value={counts.patients}
          description="Registered patients"
          icon={FiActivity}
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() => setSection("patients")}
        />

        <ProfileStatCard
          title="Appointments"
          value={counts.appointments}
          description="Hospital appointments"
          icon={FiCalendar}
          iconClass="bg-orange-50 text-orange-600"
          onClick={() => setSection("appointments")}
        />

        <ProfileStatCard
          title="Departments"
          value={counts.departments}
          description="Clinical departments"
          icon={FiBriefcase}
          iconClass="bg-cyan-50 text-cyan-600"
          onClick={() => setSection("departments")}
        />
      </div>

      {/* =====================================================
          OVERVIEW / LIST
      ===================================================== */}

      {section === "overview" ? (
        <ProfileOverview profile={profile} loading={profileLoading} />
      ) : (
        <ProfileList
          section={section}
          items={currentItems}
          loading={listLoading}
          search={search}
          setSearch={setSearch}
          onBack={() => {
            setSection("overview");
            setSearch("");
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   PROFILE OVERVIEW
========================================================= */

function ProfileOverview({ profile, loading }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* Organization */}

      <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading title="Organization Details" icon={FiHome} />

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailBox
              label="Hospital Name"
              value={profile.name}
              icon={FiHome}
            />

            <DetailBox
              label="Legal Entity"
              value={profile.legal_name}
              icon={FiBriefcase}
            />

            <DetailBox
              label="Hospital Code"
              value={profile.hospital_code}
              icon={FiHash}
              mono
            />

            <DetailBox
              label="Hospital Type"
              value={profile.hospital_type}
              icon={HiOutlineShieldCheck}
            />

            <DetailBox
              label="Registration Number"
              value={profile.registration_number}
              icon={FiHash}
              mono
            />

            <DetailBox
              label="Status"
              value={
                profile.status === "ACTIVE"
                  ? "Active & Operational"
                  : "Inactive"
              }
              icon={FiCheckCircle}
            />
          </div>
        )}
      </div>

      {/* Contact */}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading title="Contact Information" icon={FiPhone} />

        <div className="space-y-3">
          <ContactBox
            icon={FiMail}
            label="Official Email"
            value={profile.email}
          />

          <ContactBox
            icon={FiPhone}
            label="Contact Phone"
            value={profile.phone}
          />

          <ContactBox
            icon={FiMapPin}
            label="Address"
            value={
              [
                profile.address_line_1,
                profile.city,
                profile.state,
                profile.postal_code,
              ]
                .filter(Boolean)
                .join(", ") || "Not available"
            }
          />

          {profile.website && (
            <ContactBox
              icon={FiGlobe}
              label="Website"
              value={profile.website}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE LIST
========================================================= */

function ProfileList({ section, items, loading, search, setSearch, onBack }) {
  const titles = {
    branches: "Hospital Branches",
    doctors: "Hospital Doctors",
    nurses: "Hospital Nurses",
    staff: "Hospital Staff",
    patients: "Registered Patients",
    appointments: "Hospital Appointments",
    departments: "Hospital Departments",
  };

  const IconMap = {
    branches: FiLayers,
    doctors: FiUser,
    nurses: FiUsers,
    staff: FiBriefcase,
    patients: FiActivity,
    appointments: FiCalendar,
    departments: FiBriefcase,
  };

  const Icon = IconMap[section] || FiHome;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}

      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Icon size={18} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {titles[section]}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Search */}

            <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-white px-3 sm:w-[280px]">
              <FiSearch size={15} className="text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${section}...`}
                className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <FiArrowLeft size={14} />
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* List */}

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyList icon={Icon} title={`No ${section} found`} />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((item, index) => (
              <EntityRow
                key={item?.id || item?.pk || index}
                item={item}
                type={section}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-bold text-slate-700">{items.length}</span>{" "}
          records
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ENTITY ROW
========================================================= */

function EntityRow({ item, type }) {
  const getName = () => {
    if (type === "patients") {
      return (
        item?.name ||
        item?.full_name ||
        `${item?.first_name || ""} ${item?.last_name || ""}`.trim() ||
        item?.username ||
        "Patient"
      );
    }

    if (type === "doctors") {
      return (
        item?.name ||
        item?.full_name ||
        item?.doctor_name ||
        `${item?.first_name || ""} ${item?.last_name || ""}`.trim() ||
        "Doctor"
      );
    }

    if (type === "nurses") {
      return (
        item?.name ||
        item?.full_name ||
        item?.nurse_name ||
        `${item?.first_name || ""} ${item?.last_name || ""}`.trim() ||
        "Nurse"
      );
    }

    return (
      item?.name ||
      item?.full_name ||
      item?.branch_name ||
      item?.department_name ||
      item?.staff_name ||
      item?.title ||
      "Record"
    );
  };

  const name = getName();

  const email = getValue(item, ["email", "user_email", "user?.email"]);

  const phone = getValue(item, [
    "phone",
    "phone_number",
    "mobile",
    "contact_number",
  ]);

  const code = getValue(item, [
    "code",
    "branch_code",
    "department_code",
    "employee_id",
    "registration_number",
  ]);

  const city = getValue(item, ["city", "location"]);

  const iconMap = {
    branches: FiLayers,
    doctors: FiUser,
    nurses: FiUsers,
    staff: FiBriefcase,
    patients: FiActivity,
    appointments: FiCalendar,
    departments: FiBriefcase,
  };

  const Icon = iconMap[type] || FiHome;

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-amber-50 group-hover:text-amber-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-800">{name}</div>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {email && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <FiMail size={11} />
              {email}
            </span>
          )}

          {phone && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <FiPhone size={11} />
              {phone}
            </span>
          )}

          {city && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <FiMapPin size={11} />
              {city}
            </span>
          )}
        </div>

        {code && (
          <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-500">
            {code}
          </span>
        )}
      </div>

      <FiChevronRight
        size={16}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500"
      />
    </div>
  );
}

/* =========================================================
   PROFILE STAT CARD
========================================================= */

function ProfileStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-125" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-800">
            {value ?? "—"}
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1 text-[11px] font-bold text-slate-400 transition group-hover:text-amber-600">
        View records
        <FiChevronRight
          size={13}
          className="transition group-hover:translate-x-0.5"
        />
      </div>
    </button>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon: Icon, description, iconClass }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-50 transition group-hover:scale-110" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HOSPITAL LOGO
========================================================= */

function HospitalLogo({ src, name, size = "md" }) {
  const [failed, setFailed] = useState(false);

  const sizes = {
    sm: "h-11 w-11 rounded-xl",
    md: "h-16 w-16 rounded-2xl",
    lg: "h-24 w-24 rounded-3xl",
  };

  const iconSizes = {
    sm: 18,
    md: 25,
    lg: 38,
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/20 ${sizes[size]}`}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={name || "Hospital logo"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <FiHome size={iconSizes[size]} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
    </div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1 h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {title}
          </h4>

          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({ label, required = false, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT CLASS
========================================================= */

function inputClass(error) {
  return `h-11 w-full rounded-xl border ${
    error
      ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10"
      : "border-slate-200 bg-slate-50 focus:border-amber-400 focus:bg-white focus:ring-amber-500/10"
  } px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4`;
}

/* =========================================================
   DETAIL BOX
========================================================= */

function DetailBox({ label, value, icon: Icon, mono = false }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-amber-100 hover:bg-amber-50/30">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-amber-500" />

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 break-words text-sm font-bold text-slate-700 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   CONTACT BOX
========================================================= */

function ContactBox({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon size={17} />
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>

        <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY LIST
========================================================= */

function EmptyList({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon size={23} />
      </div>

      <h3 className="font-bold text-slate-700">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

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
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function HospitalTableSkeleton() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr key={index}>
          {Array.from({
            length: 6,
          }).map((__, cell) => (
            <td key={cell} className="px-5 py-5">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* =========================================================
   NURSE ICON
========================================================= */

function UsersIcon(props) {
  return <FiUsers {...props} />;
}
