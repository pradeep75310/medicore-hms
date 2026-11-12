import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiMapPin,
  FiRefreshCw,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
} from "react-icons/fi";

import { authApi } from "../../api/service";

const getProfileData = (response) => {
  const data = response?.data ?? response;

  return (
    data?.data?.user ?? data?.data ?? data?.user ?? data?.results ?? data ?? {}
  );
};

const getFullName = (profile = {}) =>
  profile.full_name ||
  profile.name ||
  [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
  profile.username ||
  "User";

const formatRole = (role = "USER") =>
  String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="group flex min-h-[92px] items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-teal-200 hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
        <Icon size={19} />
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const reduxUser = useSelector((state) => state.auth.user);

  const [profile, setProfile] = useState(reduxUser || {});
  const [form, setForm] = useState({
    first_name: reduxUser?.first_name || "",
    last_name: reduxUser?.last_name || "",
    phone: reduxUser?.phone || reduxUser?.phone_number || "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authApi.me();
      const result = getProfileData(response);

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        throw new Error("Invalid profile response");
      }

      setProfile((previous) => ({ ...previous, ...result }));

      setForm({
        first_name: result.first_name || "",
        last_name: result.last_name || "",
        phone: result.phone || result.phone_number || "",
      });

      setImageError(false);
    } catch (err) {
      console.error("Profile loading failed:", err);
      setError(
        "Latest profile details could not be loaded. Showing available account information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await authApi.me();
        const result = getProfileData(response);

        if (!mounted) return;

        if (result && typeof result === "object" && !Array.isArray(result)) {
          setProfile((previous) => ({ ...previous, ...result }));

          setForm({
            first_name: result.first_name || "",
            last_name: result.last_name || "",
            phone: result.phone || result.phone_number || "",
          });
        }
      } catch (err) {
        if (mounted) {
          console.error("Profile loading failed:", err);
          setError(
            "Could not load the latest profile. Showing available account information.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const fullName = getFullName(profile);
  const role = formatRole(profile?.role_name || profile?.role);

  const avatar =
    profile?.profile_image ||
    profile?.profileImage ||
    profile?.avatar ||
    profile?.image ||
    "";

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setForm({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || profile?.phone_number || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    if (typeof authApi.updateProfile !== "function") {
      setError(
        "Profile update API is not configured yet. Add updateProfile to authApi in your service.js file.",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      };

      const response = await authApi.updateProfile(payload);
      const updated = getProfileData(response);

      const nextProfile = {
        ...profile,
        ...payload,
        ...(updated && typeof updated === "object" ? updated : {}),
      };

      setProfile(nextProfile);
      setForm({
        first_name: nextProfile.first_name || "",
        last_name: nextProfile.last_name || "",
        phone: nextProfile.phone || nextProfile.phone_number || "",
      });

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed:", err);

      const serverMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error;

      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : "Profile could not be updated. Please check your backend update endpoint.",
      );
    } finally {
      setSaving(false);
    }
  };

  const details = [
    {
      label: "Username",
      value: profile?.username,
      icon: FiUser,
    },
    {
      label: "Email Address",
      value: profile?.email,
      icon: FiMail,
    },
    {
      label: "Phone Number",
      value: profile?.phone || profile?.phone_number,
      icon: FiPhone,
    },
    {
      label: "Account Role",
      value: role,
      icon: FiShield,
    },
    {
      label: "Hospital",
      value:
        profile?.hospital_name ||
        profile?.hospital?.name ||
        (typeof profile?.hospital === "string" ? profile.hospital : ""),
      icon: FiMapPin,
    },
    {
      label: "Branch",
      value:
        profile?.branch_name ||
        profile?.branch?.name ||
        (typeof profile?.branch === "string" ? profile.branch : ""),
      icon: FiMapPin,
    },
    {
      label: "Department",
      value:
        profile?.department_name ||
        profile?.department?.name ||
        (typeof profile?.department === "string" ? profile.department : ""),
      icon: FiMapPin,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-5 sm:px-6 lg:px-8">
      {/* {profileImage ? (
  <img
    src={profileImage}
    alt="Super User Profile"
    className="h-14 w-14 rounded-full object-cover"
  />
) : (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
    <FiUser size={26} />
  </div>
)} */}

      <div className="mx-auto max-w-6xl">
        {/* Top navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <FiArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="text-teal-700">MediCore HMS</span>
            <span>/</span>
            <span>My Profile</span>
          </div>
        </div>

        {/* Page heading */}
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            Account Management
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Manage your personal information and view your hospital account
            details in one place.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
            <p>{success}</p>
          </div>
        )}

        {/* Profile hero */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-36 overflow-hidden bg-gradient-to-r from-slate-900 via-teal-900 to-cyan-700 sm:h-44">
            <div className="absolute -right-8 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-cyan-400/10 blur-2xl" />

            <div className="absolute bottom-5 left-6 sm:left-8">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur">
                Verified account details
              </span>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-11 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
              <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                {avatar && !imageError ? (
                  <img
                    src={avatar}
                    alt={fullName}
                    onError={() => setImageError(true)}
                    className="h-full w-full rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-500 to-cyan-700 text-3xl font-bold text-white shadow-md">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white">
                  <FiCamera size={14} />
                </div>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <h2 className="break-words text-2xl font-bold text-slate-900">
                  {fullName}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {profile?.email || "Email not available"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    <FiShield size={13} />
                    {role}
                  </span>

                  {profile?.is_active !== false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Account
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-1">
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setEditing(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    <FiEdit2 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <FiX size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Account information */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Account Information
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Your registered details and organization information.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfile}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                className={loading ? "animate-spin" : ""}
                size={15}
              />
              Refresh
            </button>
          </div>

          <div className="p-5 sm:p-7">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : editing ? (
              <form onSubmit={handleSaveProfile}>
                <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      First Name <span className="text-rose-500">*</span>
                    </label>

                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={form.first_name}
                      onChange={handleInputChange}
                      required
                      maxLength={150}
                      autoComplete="given-name"
                      placeholder="Enter first name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Last Name
                    </label>

                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={form.last_name}
                      onChange={handleInputChange}
                      maxLength={150}
                      autoComplete="family-name"
                      placeholder="Enter last name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile_email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <input
                      id="profile_email"
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Email is managed by your account settings.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleInputChange}
                      maxLength={20}
                      autoComplete="tel"
                      placeholder="Enter phone number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSave size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard icon={FiUser} label="Full Name" value={fullName} />

                {details.map((item) => (
                  <InfoCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
