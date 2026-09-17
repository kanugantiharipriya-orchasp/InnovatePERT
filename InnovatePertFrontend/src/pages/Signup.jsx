import { useState, useEffect } from "react";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { validatePersonName, validateEmail, validatePassword, handleNameInput } from "../utils/validation";
import PasswordInput from "../components/PasswordInput";
import useScrollLock from "../utils/useScrollLock";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function Signup({ onClose, goLogin }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  useScrollLock();

  const clearAllErrors = () => { setError(""); setFieldErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors(); setSuccess("");

    const errs = {};

    if (!form.fullName.trim()) {
      errs.fullName = "Full name is required.";
    } else {
      const nameErr = validatePersonName(form.fullName);
      if (nameErr) errs.fullName = nameErr;
    }

    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else {
      const emailErr = validateEmail(form.email);
      if (emailErr) errs.email = emailErr;
    }

    if (!form.password) {
      errs.password = "Password is required.";
    } else {
      const pwErr = validatePassword(form.password);
      if (pwErr) errs.password = pwErr;
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Password do not match";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        throw new Error(result.message || "Signup failed.");
      }
      setSuccess("Account created! Redirecting to login…");
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
      setTimeout(() => goLogin?.(), 2000);
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl bg-white border border-slate-200 py-3.5 text-sm " +
    "text-slate-800 placeholder-slate-300 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none";

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

      {/* Glassmorphism card */}
      <div
        className={`relative z-10 w-full max-w-215 h-140 rounded-3xl overflow-hidden
          bg-white/90 backdrop-blur-2xl ring-1 ring-white/70
          shadow-2xl shadow-sky-300/40 transition-all duration-300
          ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left glass panel ── */}
        <div
          className="absolute inset-y-0 left-0 w-[42%] hidden md:flex flex-col
          justify-between p-8 overflow-hidden
          bg-white/25 backdrop-blur-md border-r border-white/50"
        >
          <div className="animate-pulse absolute -top-20 -left-20 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="animate-pulse absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
          <div className="absolute top-1/3 -right-16 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl
              bg-white/80 border border-white/60 font-black text-cyan-600 text-sm shadow-lg backdrop-blur-sm"
            >
              IP
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">
              Innovate<span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">PERT</span>
            </span>
          </div>

          {/* Centre */}
          <div className="relative text-center">
            <div className="relative mx-auto h-28 w-28 mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-sky-200/80 bg-white/30" />
              <div className="absolute inset-3 rounded-full border-2 border-cyan-200/80 bg-white/20" />
              <div className="absolute inset-6 rounded-full border-2 border-blue-200/70" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-sm">
                ✨
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Join the team!
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-45 mx-auto">
              Create account and start mastering project timelines.
            </p>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { v: "Free", l: "To get started" },
              { v: "2 min", l: "Setup time" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl bg-white/50 border border-white/70
                p-3 text-center backdrop-blur-sm shadow-sm"
              >
                <p className="text-lg font-black text-slate-800">{s.v}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right glass form panel ── */}
        <div
          className="md:ml-[42%] h-full flex flex-col justify-center
          bg-white/55 backdrop-blur-2xl p-8 md:p-10 overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center
              rounded-xl bg-white/40 text-slate-500 backdrop-blur-sm border border-white/60
              hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
          >
            <FaTimes size={14} />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800">
              Create account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Register to get full access to InnovatePERT.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="new-password"
            className="space-y-3.5"
          >
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input type="text" name="fullName-new" autoComplete="new-password" placeholder="John Doe"
                  value={form.fullName} onInput={handleNameInput} onChange={(e) => { setFieldErrors((p) => ({ ...p, fullName: undefined })); setForm((p) => ({ ...p, fullName: e.target.value })); }}
                  className={inputCls + " pl-11 pr-4" + (fieldErrors.fullName ? " border border-red-400" : "")} />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Email address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  name="register-email"
                  autoComplete="new-password"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                    setForm((p) => ({ ...p, email: e.target.value }));
                  }}
                  className={inputCls + " pl-11 pr-4" + (fieldErrors.email ? " border border-red-400" : "")}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <PasswordInput
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                maxLength={22}
                value={form.password}
                onChange={(e) => {
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                  setForm((p) => ({ ...p, password: e.target.value }));
                }}
                className={inputCls + " pl-11 pr-12" + (fieldErrors.password ? " border border-red-400" : "")}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Confirm Password
              </label>
              <PasswordInput
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                maxLength={22}
                value={form.confirmPassword}
                onChange={(e) => {
                  setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                  setForm((p) => ({ ...p, confirmPassword: e.target.value }));
                }}
                className={inputCls + " pl-11 pr-12" + (fieldErrors.confirmPassword ? " border border-red-400" : "")}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>

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
                  Creating…
                </span>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button
              onClick={goLogin}
              className="font-bold text-sky-600 hover:text-sky-800 transition cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
