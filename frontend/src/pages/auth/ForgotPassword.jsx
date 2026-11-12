
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { api } from "../../api/client";

export default function ForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    new_password: "",
    confirm_password: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ==========================================
  // OTP TIMER
  // ==========================================

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!otpSent || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;

  const otpExpired = otpSent && timeLeft === 0;

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const change = (e) =>
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

  // ==========================================
  // STRONG PASSWORD VALIDATION
  // ==========================================

  const passwordRules = useMemo(
    () => [
      {
        label: "At least 10 characters",
        valid: form.new_password.length >= 10,
      },
      {
        label: "One uppercase letter",
        valid: /[A-Z]/.test(form.new_password),
      },
      {
        label: "One lowercase letter",
        valid: /[a-z]/.test(form.new_password),
      },
      {
        label: "One number",
        valid: /\d/.test(form.new_password),
      },
      {
        label: "One special character",
        valid: /[^A-Za-z0-9]/.test(form.new_password),
      },
      {
        label: "No spaces",
        valid:
          form.new_password.length > 0 &&
          !/\s/.test(form.new_password),
      },
    ],
    [form.new_password]
  );

  const validRules = passwordRules.filter(
    (rule) => rule.valid
  ).length;

  const strongPassword =
    validRules === passwordRules.length;

  const passwordsMatch =
    form.confirm_password.length > 0 &&
    form.new_password === form.confirm_password;

  // ==========================================
  // SEND / RESEND OTP
  // ==========================================

  const send = async () => {
    const email = form.email.trim().toLowerCase();

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const r = await api.post(
        "/accounts/forgot-password/",
        {
          email,
        }
      );

      setOtpSent(true);

      // Start / restart 10 minute timer
      setTimeLeft(10 * 60);

      // Clear old OTP when resend
      setForm((p) => ({
        ...p,
        email,
        otp: "",
      }));

      toast.success(r.message || "OTP sent.");
    } catch (e) {
      toast.error(
        e?.message ||
          e?.response?.data?.detail ||
          "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const reset = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!otpSent) {
      toast.error("Please send OTP first.");
      return;
    }

    if (form.otp.length !== 6) {
      toast.error("Enter a valid 6 digit OTP.");
      return;
    }

    if (otpExpired) {
      toast.error(
        "OTP has expired. Please request a new OTP."
      );
      return;
    }

    if (!strongPassword) {
      toast.error("Please create a strong password.");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const r = await api.post(
        "/accounts/reset-password/",
        form
      );

      toast.success(
        r.message ||
          "Password reset successfully."
      );

      setDone(true);
    } catch (e) {
      toast.error(
        e?.message ||
          e?.response?.data?.detail ||
          "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* =========================================
            LEFT PANEL
        ========================================== */}

        <div className="hidden lg:flex bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-10 text-white flex-col justify-between min-h-[650px]">

          <div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">

              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HiOutlineShieldCheck className="text-3xl" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  MediCore
                </h1>

                <p className="text-xs text-white/80 tracking-wider">
                  HOSPITAL MANAGEMENT SYSTEM
                </p>
              </div>

            </div>

            <div className="max-w-sm">

              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <FiLock className="text-3xl" />
              </div>

              <h2 className="text-4xl font-bold leading-tight mb-5">
                Reset your
                <br />
                password securely
              </h2>
            </div>

          </div>

          {/* Security Card */}
          <div className="border border-white/20 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">

            <div className="flex gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <FiShield />
              </div>

              <div>

                <p className="font-semibold mb-1">
                  Secure Password Recovery
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =========================================
            RIGHT PANEL
        ========================================== */}

        <div className="p-6 sm:p-10 lg:p-12 bg-white">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">

            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <HiOutlineShieldCheck className="text-2xl" />
            </div>

            <div>

              <h1 className="text-xl font-bold text-slate-900">
                MediCore
              </h1>

              <p className="text-[10px] text-slate-500 tracking-wider">
                HOSPITAL MANAGEMENT SYSTEM
              </p>

            </div>

          </div>

          {done ? (

            /* =====================================
               SUCCESS
            ====================================== */

            <div className="flex flex-col items-center justify-center text-center min-h-[500px]">

              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                <FiCheck className="text-4xl" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Password Reset
              </h2>

              <p className="text-slate-500 mt-3 max-w-sm leading-relaxed">
                Your password has been reset successfully.
                You can now sign in using your new password.
              </p>

              <Link
                to="/login"
                className="mt-7 w-full max-w-xs h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold flex items-center justify-center shadow-lg shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700 transition-all"
              >
                Back to Login
              </Link>

            </div>

          ) : (

            <>

              {/* Header */}
              <div className="mb-8">

                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <FiLock className="text-2xl" />
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                  Forgot Password
                </h2>

                <p className="text-slate-500 mt-2 leading-relaxed">
                  Enter your email, verify the OTP,
                  and create a new secure password.
                </p>

              </div>

              <form
                onSubmit={reset}
                className="space-y-5"
              >

                {/* =================================
                    EMAIL
                ================================== */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="relative">

                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white"
                      type="email"
                      name="email"
                      placeholder="Enter your registered email"
                      value={form.email}
                      onChange={change}
                      required
                    />

                  </div>

                </div>

                {/* =================================
                    OTP
                ================================== */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Verification Code
                  </label>

                  <div className="flex gap-2">

                    <input
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 tracking-[0.35em] text-center font-semibold"
                      name="otp"
                      placeholder="000000"
                      value={form.otp}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          otp: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        }))
                      }
                      maxLength={6}
                      required={otpSent}
                      inputMode="numeric"
                    />

                    <button
                      type="button"
                      className="h-12 px-4 rounded-xl bg-slate-900 text-white font-semibold whitespace-nowrap hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={send}
                      disabled={loading}
                    >
                      {otpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                    </button>

                  </div>

                  {/* OTP TIMER */}
                  {otpSent && (
                    <div className="flex items-center justify-between mt-2">

                      <div
                        className={`flex items-center gap-2 text-xs ${
                          otpExpired
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >

                        <FiClock />

                        {otpExpired
                          ? "OTP expired. Please resend OTP."
                          : "OTP valid for 10 minutes"}

                      </div>

                      {!otpExpired && (
                        <span
                          className={`text-sm font-bold ${
                            timeLeft <= 60
                              ? "text-red-500"
                              : "text-amber-600"
                          }`}
                        >
                          {formattedTime}
                        </span>
                      )}

                    </div>
                  )}

                </div>

                {/* =================================
                    PASSWORD SECTION
                ================================== */}

                {otpSent && (
                  <>

                    {/* New Password */}
                    <div>

                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        New Password
                      </label>

                      <div className="relative">

                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                        <input
                          className={`w-full h-12 pl-11 pr-12 rounded-xl border bg-slate-50 text-slate-800 outline-none transition-all ${
                            form.new_password
                              ? strongPassword
                                ? "border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                                : "border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                              : "border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          }`}
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="new_password"
                          placeholder="Create a strong password"
                          minLength={10}
                          value={form.new_password}
                          onChange={change}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (p) => !p
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600"
                        >
                          {showPassword ? (
                            <FiEyeOff size={19} />
                          ) : (
                            <FiEye size={19} />
                          )}
                        </button>

                      </div>

                      {/* Password Rules */}
                      {form.new_password && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">

                          {passwordRules.map((rule) => (
                            <div
                              key={rule.label}
                              className={`flex items-center gap-2 text-xs ${
                                rule.valid
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >

                              {rule.valid ? (
                                <FiCheck />
                              ) : (
                                <FiX />
                              )}

                              <span>
                                {rule.label}
                              </span>

                            </div>
                          ))}

                        </div>
                      )}

                    </div>

                    {/* Confirm Password */}
                    <div>

                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirm Password
                      </label>

                      <div className="relative">

                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                        <input
                          className={`w-full h-12 pl-11 pr-12 rounded-xl border bg-slate-50 text-slate-800 outline-none transition-all ${
                            form.confirm_password &&
                            !passwordsMatch
                              ? "border-red-300 focus:ring-4 focus:ring-red-500/10"
                              : passwordsMatch
                              ? "border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                              : "border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          }`}
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirm_password"
                          placeholder="Confirm your password"
                          minLength={10}
                          value={form.confirm_password}
                          onChange={change}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (p) => !p
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600"
                        >
                          {showConfirmPassword ? (
                            <FiEyeOff size={19} />
                          ) : (
                            <FiEye size={19} />
                          )}
                        </button>

                      </div>

                      {/* Password Match */}
                      {form.confirm_password && (
                        <div
                          className={`mt-2 flex items-center gap-2 text-xs font-medium ${
                            passwordsMatch
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >

                          {passwordsMatch ? (
                            <>
                              <FiCheck />
                              Passwords match
                            </>
                          ) : (
                            <>
                              <FiX />
                              Passwords do not match
                            </>
                          )}

                        </div>
                      )}

                    </div>

                    {/* =================================
                        RESET BUTTON
                    ================================== */}

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        otpExpired ||
                        !strongPassword ||
                        !passwordsMatch
                      }
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >

                      {loading ? (
                        <span className="flex items-center justify-center gap-2">

                          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                          Resetting...

                        </span>
                      ) : otpExpired ? (
                        "OTP Expired"
                      ) : (
                        "Reset Password"
                      )}

                    </button>

                  </>
                )}

              </form>

              {/* Back */}
              <div className="mt-7 text-center">

                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors"
                >
                  Back to Login
                </Link>

              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              </div>

            </>
          )}

        </div>

      </div>

    </div>
  );
}


