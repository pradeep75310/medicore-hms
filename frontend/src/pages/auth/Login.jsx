import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/authSlice";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiRefreshCw,
  FiUserPlus,
  FiKey,
} from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import toast from "react-hot-toast";
import { api } from "../../api/client";

const getErrorMessage = (err) => {
  const data = err?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return String(data.detail);
  }

  if (data?.message) {
    return String(data.message);
  }

  if (data?.error) {
    return String(data.error);
  }

  if (Array.isArray(data?.non_field_errors)) {
    return String(data.non_field_errors[0]);
  }

  if (data && typeof data === "object") {
    for (const [field, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${value[0]}`;
      }

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  if (!err?.response) {
    return "Unable to connect to the server. Please try again.";
  }

  if (err.response.status === 401) {
    return "Invalid username/email or password.";
  }

  if (err.response.status === 403) {
    return "Access denied. Your account may require approval.";
  }

  if (err.response.status >= 500) {
    return "Server error. Please try again later.";
  }

  return "Login failed. Please check your credentials.";
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const email = formData.email.trim();

    if (!email) {
      toast.error("Please enter your email or user ID.");
      return false;
    }

    if (email.length < 3) {
      toast.error("Please enter a valid email or user ID.");
      return false;
    }

    if (!formData.password) {
      toast.error("Please enter your password.");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await api.login(formData.email.trim(), formData.password);
      const userObj = res?.user;

      if (!userObj || !userObj.role || !res?.access) {
        console.error("Invalid login response:", res);

        toast.error("Invalid login response. Please check your backend API.");

        return;
      }

      const actualRole = String(userObj.role).trim().toUpperCase();
      dispatch(
        login({
          user: {
            ...userObj,
            name: userObj.first_name
              ? `${userObj.first_name} ${userObj.last_name || ""}`.trim()
              : userObj.username || userObj.email || "User",
          },
          role: actualRole,
          token: res.access,
          refresh: res.refresh,
        }),
      );

      toast.success("Logged in successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR:", err?.response?.data || err);

      toast.error(getErrorMessage(err), {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-medicore-600/20 rounded-full blur-3xl" />

        <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-3xl" />

        <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative z-10 p-10 xl:p-14 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 backdrop-blur flex items-center justify-center">
            <HiOutlineShieldCheck className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">MediCore</h1>
          </div>
        </div>

        <div className="max-w-xl">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mt-6">
            Hospital Management
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medicore-400 to-cyan-400">
              System
            </span>
          </h2>
        </div>

        <div className="text-xs text-slate-600">© 2026 HMS</div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-medicore-500 to-blue-600 flex items-center justify-center">
                <HiOutlineShieldCheck className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-white">MediCore</h1>

                <p className="text-xs text-slate-400">Enterprise HMS</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
            <div className="px-7 sm:px-9 pt-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-medicore-500 to-blue-600 flex items-center justify-center shadow-lg shadow-medicore-500/20">
                  <HiOutlineShieldCheck className="w-7 h-7 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                    Welcome Back
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                </div>
              </div>
            </div>

            <div className="px-7 sm:px-9 py-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Username / Email
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <div className="relative">
                    <FiMail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      id="login-email"
                      type="text"
                      name="email"
                      autoComplete="username"
                      required
                      className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:bg-white focus:border-medicore-500 focus:ring-4 focus:ring-medicore-500/10"
                      placeholder="Enter your email or user ID"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <div className="relative">
                    <FiLock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      minLength={6}
                      className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-11 text-sm text-gray-800 outline-none transition focus:bg-white focus:border-medicore-500 focus:ring-4 focus:ring-medicore-500/10"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-medicore-600 focus:ring-medicore-500"
                    />

                    <span className="text-xs sm:text-sm text-gray-500">
                      Remember me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm font-semibold text-medicore-600 hover:text-medicore-700 transition"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-medicore-500 to-blue-600 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={18} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  New to MediCore?
                </p>

                <div className="space-y-3">
                  <Link
                    to="/register"
                    className="min-h-11 w-full rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-sky-700 transition"
                  >
                    <FiUserPlus size={17} />
                    Patient Registration
                    <FiArrowRight size={15} className="ml-auto" />
                  </Link>

                  <Link
                    to="/superuser/register"
                    className="min-h-11 w-full rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-amber-700 transition"
                  >
                    <FiShield size={17} />
                    Register Super User
                    <FiArrowRight size={15} className="ml-auto" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-5">
            © 2026 HMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
