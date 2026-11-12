import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiMail,
  FiShield,
  FiArrowLeft,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { patientApi, authApi } from "../../api/service";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [timeLeft, setTimeLeft] = useState(1 * 60);

  const [email, setEmail] = useState(
    params.get("email") ||
      sessionStorage.getItem("patientVerificationEmail") ||
      "",
  );

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [isResending, setIsResending] = useState(false);

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email address not found.");
      return;
    }
    try {
      setIsResending(true);

      const response = await authApi.patientResendOtp(email);

      console.log("Resend OTP response:", response);

      const data = response?.data ?? response;

      if (data?.success) {
        setOtp("");
        setTimeLeft(60);
        toast.success(data.message || "New OTP sent successfully.");
      } else {
        toast.error(data?.message || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to resend OTP.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Email is required");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Enter a valid 6 digit OTP");
      return;
    }

    setLoading(true);

    try {
      await patientApi.verifypatOTP({
        email: cleanEmail,
        otp,
      });

      sessionStorage.removeItem("patientVerificationEmail");

      toast.success("Email verified successfully. You can now login.");

      navigate("/login");
    } catch (error) {
      toast.error(
        error?.message ||
          error?.response?.data?.detail ||
          "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        {/* LEFT BRAND PANEL */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-10 text-white flex-col justify-between min-h-[560px]">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HiOutlineShieldCheck className="text-3xl" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">MediCore</h1>
                <p className="text-xs text-white/80 tracking-wider">
                  HOSPITAL MANAGEMENT SYSTEM
                </p>
              </div>
            </div>

            <div className="max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6">
                <FiMail className="text-3xl" />
              </div>

              <h2 className="text-4xl font-bold leading-tight mb-5">
                Verify your
                <br />
                email address
              </h2>
            </div>
          </div>

          {/* Security Info */}
          <div className="border border-white/20 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <FiLock />
              </div>

              <div>
                <p className="font-semibold mb-1">
                  Email Verification is Mandatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="p-6 sm:p-10 lg:p-12 bg-white flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <HiOutlineShieldCheck className="text-2xl" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">MediCore</h1>
              <p className="text-[10px] text-slate-500 tracking-wider">
                HOSPITAL MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <FiShield className="text-2xl" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Verify Email</h2>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white"
                  readOnly={!!params.get("email")}
                />
              </div>
            </div>

            {/* OTP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Verification Code
                </label>

                <span className="text-xs font-medium text-slate-400">
                  6 digits
                </span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  OTP valid for 1 minutes
                </span>

                <span
                  className={`text-sm font-bold ${
                    timeLeft <= 60 ? "text-red-500" : "text-amber-600"
                  }`}
                >
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
              </div>

              {/* resend otp */}

              {timeLeft > 0 ? (
                <p className="mt-3 text-sm text-slate-500">Resend OTP</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResending ? "Sending OTP..." : "Resend OTP"}
                </button>
              )}

              <div className="relative">
                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  className="w-full h-14 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white tracking-[0.65em] text-center text-xl font-bold placeholder:tracking-[0.65em] placeholder:text-slate-300"
                />
              </div>

              {/* OTP Status */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                {otp.length === 6 ? (
                  <>
                    <FiCheckCircle className="text-emerald-500" />
                    <span className="text-emerald-600 font-medium">
                      Valid 6-digit OTP entered
                    </span>
                  </>
                ) : (
                  <>
                    <FiLock className="text-slate-400" />
                    <span className="text-slate-400">
                      Enter the 6-digit code from your email
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all duration-200 hover:from-amber-600 hover:to-orange-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {/* Back/Login */}
          <div className="mt-7 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors"
            >
              <FiArrowLeft />
              Back to Login
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center"></div>
        </div>
      </div>
    </div>
  );
}
