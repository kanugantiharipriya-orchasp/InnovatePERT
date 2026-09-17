import { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaUserPlus,
  FaUserTie,
  FaEnvelope,
} from "react-icons/fa";
import { projectManagerService } from "../services/projectManagerService";
import { validatePersonName, validateEmail, handleNameInput } from "../utils/validation";
import useScrollLock from "../utils/useScrollLock";

function CreateManagerModal({ isOpen, onClose, onSuccess }) {
  useScrollLock(isOpen);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = "Full Name is required";
    } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 50) {
      errors.fullName = "Full Name should be between 2 and 50 characters";
    } else if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(formData.fullName)) {
      errors.fullName = "Name can contain letters and single spaces only.";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      const domain = formData.email.split('@')[1]?.toLowerCase();
      const misspelledDomains = ['gmal.com', 'gmial.com', 'gmali.com', 'yahooo.com', 'outlok.com'];
      
      if (!emailRegex.test(formData.email) || misspelledDomains.includes(domain)) {
        errors.email = "Invalid email";
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    
    setLoading(true);

    try {
      await projectManagerService.create(formData);

      // Reset form
      setFormData({
        fullName: "",
        email: "",
      });

      onSuccess();
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      else alert("Registration failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <FaUserPlus className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Create Project Manager</h2>
                <p className="text-xs text-slate-500">
                  Credentials will be emailed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400
                transition hover:bg-slate-100 hover:text-slate-600"
              title="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="relative">
            <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
            <input
              className={"w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.fullName ? " border-red-500 ring-1 ring-red-500" : "")}
              type="text"
              placeholder="Full Name"
              maxLength={50}
              value={formData.fullName}
              onInput={handleNameInput}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                setFieldErrors({ ...fieldErrors, fullName: "" });
              }}
            />
            {fieldErrors.fullName && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.fullName}</p>}
          </div>

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
            <input
              className={"w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.email ? " border-red-500 ring-1 ring-red-500" : "")}
              type="email"
              placeholder="Email Address"
              maxLength={50}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setFieldErrors({ ...fieldErrors, email: "" });
              }}
            />
            {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold
              text-white shadow-lg shadow-cyan-300/40 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <FaSpinner className="animate-spin mx-auto" />
            ) : (
              "Register Manager"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateManagerModal;
