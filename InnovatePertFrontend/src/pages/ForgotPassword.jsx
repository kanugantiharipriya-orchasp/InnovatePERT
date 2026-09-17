import { useState, useEffect } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTimes, FaKey, FaShieldAlt } from "react-icons/fa";
import { validateEmail, validatePassword } from "../utils/validation";
import PasswordInput from "../components/PasswordInput";
import useScrollLock from "../utils/useScrollLock";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/* Step indicator */
const steps = ["Email", "OTP", "Reset"];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
                transition-all duration-300
                ${done ? "bg-sky-500 text-white" : ""}
                ${active ? "bg-sky-500 text-white ring-4 ring-sky-100" : ""}
                ${!done && !active ? "bg-slate-100 text-slate-400" : ""}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide
                ${active || done ? "text-sky-600" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300
                ${done ? "bg-sky-500" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ForgotPassword({ onClose, goLogin }) {
  const [visible, setVisible] = useState(false);

  const [step, setStep] = useState(0); // 0=email,1=otp,2=reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  useScrollLock();

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* ── Step 1: send OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages(); 
    setOtpCode("");
    
    const emailErr = validateEmail(forgotEmail);
    if (emailErr) { setError(emailErr); return; }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const text = await res.text();
      let result = {};
      try { result = JSON.parse(text); } catch { result = text; }
      const errorMsg = typeof result === "string" ? result : result.message;

      if (!res.ok) throw new Error(errorMsg || "Unable to send OTP.");
      setSuccess(typeof result === "string" ? result : result.message || "OTP sent to your email.");
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otpCode.trim(),
        }),
      });
      const text = await res.text();
      let result = {};
      try { result = JSON.parse(text); } catch { result = text; }
      const errorMsg = typeof result === "string" ? result : result.message;

      if (!res.ok) throw new Error(errorMsg || "Invalid OTP.");
      setSuccess(typeof result === "string" ? result : result.message || "OTP verified.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: reset password ── */
  const handleReset = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!newPassword) {
      setError("Password is required");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      setError("Password must be 8-16 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[@#$%^&+=!]/.test(newPassword)) {
      setError("Password must contain at least one special character");
      return;
    }
    
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otpCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const text = await res.text();
      let result = {};
      try { result = JSON.parse(text); } catch { result = text; }
      const errorMsg = typeof result === "string" ? result : result.message;

      if (!res.ok) throw new Error(errorMsg || "Unable to reset password.");
      setSuccess("Password reset successfully! Redirecting…");
      setTimeout(() => {
        onClose?.();
        goLogin?.();
      }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl bg-white border border-slate-200 py-3.5 text-sm " +
    "text-slate-800 placeholder-slate-300 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none";

  const stepIcon = [
    <FaEnvelope size={22} />,
    <FaKey size={22} />,
    <FaShieldAlt size={22} />,
  ];
  const stepTitle = [
    "Reset your password",
    "Enter the OTP",
    "Set new password",
  ];
  const stepSubtitle = [
    "We'll send a one-time code to your email.",
    `Code sent to ${forgotEmail || "your email"}. Check your inbox.`,
    "OTP verified. Choose a strong new password.",
  ];

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

      <div
        className={`relative z-10 w-full max-w-215 min-h-130 rounded-3xl overflow-hidden
          bg-white/70 backdrop-blur-2xl ring-1 ring-white/70
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
          <div className="animate-pulse absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute top-1/3 -right-16 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
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

          {/* Centre */}
          <div className="relative text-center">
            <div className="relative mx-auto h-28 w-28 mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-sky-200" />
              <div className="absolute inset-3 rounded-full border-2 border-cyan-200/90" />
              <div className="absolute inset-6 rounded-full border-2 border-blue-200" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-sm">
                🔐
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Secure Recovery
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[180px] mx-auto">
              3-step verification to safely reset your password.
            </p>
          </div>

          {/* Step list */}
          <div className="relative space-y-2">
            {["Enter email address", "Verify OTP code", "Set new password"].map(
              (t, i) => (
                <div
                  key={t}
                  className={`flex items-center gap-3 rounded-2xl p-3 shadow-sm
                ${
                  i === step
                    ? "bg-white/95 border border-sky-200"
                    : i < step
                      ? "bg-white/70 border border-white/90"
                      : "opacity-50"
                }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                  text-[11px] font-black
                  ${i < step ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"}`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {t}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* ── Right glass form panel ── */}
        <div
          className="md:ml-[42%] min-h-130 flex flex-col justify-center
          bg-white/55 backdrop-blur-2xl p-8 md:p-10"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center
              rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
          >
            <FaTimes size={14} />
          </button>

          {/* Step bar */}
          <StepBar current={step} />

          {/* Step icon + title */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
              bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200"
            >
              {stepIcon[step]}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {stepTitle[step]}
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                {stepSubtitle[step]}
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && step !== 2 && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* ── Step 0: Email ── */}
          {step === 0 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputCls + " pl-11 pr-4"}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-2xl py-3.5 text-sm font-bold text-white
                  bg-linear-to-r from-sky-500 to-blue-600
                  shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send OTP →"
                )}
              </button>
            </form>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="relative">
                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className={
                    inputCls +
                    " pl-11 pr-4 tracking-widest text-center font-mono text-lg"
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-2xl py-3.5 text-sm font-bold text-white
                  bg-linear-to-r from-sky-500 to-blue-600
                  shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify OTP →"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setOtpCode("");
                  setStep(0);
                }}
                className="w-full text-sm text-slate-900 hover:text-violet-600 transition cursor-pointer"
              >
                ← Change email
              </button>
            </form>
          )}

          {/* ── Step 2: New password ── */}
          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              {success && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
              <PasswordInput
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                lockClassName="text-slate-300"
                className={inputCls + " pl-11 pr-12"}
              />
              <PasswordInput
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                lockClassName="text-slate-300"
                className={inputCls + " pl-11 pr-12"}
              />
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-2xl py-3.5 text-sm font-bold text-white
                  bg-linear-to-r from-sky-500 to-blue-600
                  shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Resetting…
                  </span>
                ) : (
                  "Reset Password →"
                )}
              </button>
            </form>
          )}

          <button
            onClick={goLogin}
            className="mt-6 text-center text-sm text-slate-900 hover:text-sky-600
              transition cursor-pointer block w-full"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
