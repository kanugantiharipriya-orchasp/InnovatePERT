

import { useState, useEffect } from "react";
import { FaEnvelope, FaTimes } from "react-icons/fa";
import PasswordInput from "../components/PasswordInput";
import { useNavigate } from "react-router-dom";
import useScrollLock from "../utils/useScrollLock";

import { validateEmail } from "../utils/validation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";



const normalizeRole = (r) =>
  String(r || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
const getDashboardPath = (role) => {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "/admin/dashboard";
  if (r === "PROJECT_MANAGER" || r === "MANAGER")
    return "/project-manager/dashboard";
  return "/";
};

function Login({ onClose, goSignup, goForgot }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  useScrollLock();

  const clearAllErrors = () => { setError(""); setFieldErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors();

    const errs = {};

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errs.email = "Invalid email";
      }
    }

    if (!form.password) {
      errs.password = "Password is required";
    } else {
      if (form.password.length < 8 || form.password.length > 16) {
        errs.password = "Password must be 8-16 characters";
      } else if (!/[A-Z]/.test(form.password)) {
        errs.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(form.password)) {
        errs.password = "Password must contain at least one lowercase letter";
      } else if (!/\d/.test(form.password)) {
        errs.password = "Password must contain at least one number";
      } else if (!/[@#$%^&+=!]/.test(form.password)) {
        errs.password = "Password must contain at least one special character";
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Login failed.");
      }
      const token = result.token || result.accessToken || result.data?.token;
      const role =
        result.role || result.user?.role || result.data?.role || "USER";
      if (token) localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      navigate(getDashboardPath(role), { replace: true });
      onClose?.();
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      {/* Frosted scrim — the homepage stays visible behind with a soft blur */}
      <div
        className="absolute inset-0 backdrop-brightness-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(224,242,254,0.45) 0%, rgba(255,255,255,0.25) 40%, rgba(224,242,254,0.4) 100%)",
        }}
      />

      {/* Glassmorphism card — sign-in form only */}
      <div
        className={`relative z-10 w-full max-w-md rounded-3xl overflow-hidden
          bg-white/90 backdrop-blur-2xl ring-1 ring-white/70
          shadow-2xl shadow-sky-300/40 transition-all duration-300
          ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Glass form panel ── */}
        <div className="relative flex flex-col justify-center overflow-hidden bg-white/55 backdrop-blur-2xl p-8 md:p-10">
          {/* soft orbs inside the glass so they glow through it */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center
              rounded-xl bg-white/40 text-slate-500 backdrop-blur-sm border border-white/60
              hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
          >
            <FaTimes size={14} />
          </button>

          {/* Brand */}
          <div className="mb-7 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl
              bg-white/80 border border-white/60 font-black text-blue-600 text-sm shadow-lg backdrop-blur-sm"
            >
              IP
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">
              Innovate<span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">PERT</span>
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-800">Sign in</h2>
          <p className="mt-1.5 mb-8 text-sm text-slate-500">
            Enter your credentials to access your workspace.
          </p>

          {error && (
            <div
              className="mb-5 rounded-2xl border border-red-100 bg-red-50
              px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Email address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                    setForm((p) => ({ ...p, email: e.target.value }));
                  }}
                  className={"w-full rounded-2xl bg-white border border-slate-200 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-300 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.email ? " border border-red-400" : "")}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={goForgot}
                  className="text-xs font-semibold text-sky-600
                    hover:text-sky-800 transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => {
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                  setForm((p) => ({ ...p, password: e.target.value }));
                }}
                className={"w-full rounded-2xl bg-white border border-slate-200 py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder-slate-300 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.password ? " border border-red-400" : "")}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-2xl py-3.5 text-sm font-bold text-white
                bg-linear-to-r from-sky-500 to-blue-600
                shadow-lg shadow-sky-300/60 hover:shadow-sky-300
                hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 cursor-pointer mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account yet?{" "}
            <button
              onClick={goSignup}
              className="font-bold text-sky-600 hover:text-sky-800 transition cursor-pointer"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;