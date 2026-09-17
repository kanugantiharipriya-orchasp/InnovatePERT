import { useState, useEffect } from "react";
import {
  FaTimes,
  FaSpinner,
  FaEdit,
  FaUserTie,
  FaEnvelope,
} from "react-icons/fa";
import { projectManagerService } from "../services/projectManagerService";
import { validatePersonName, validateEmail, handleNameInput } from "../utils/validation";
import useScrollLock from "../utils/useScrollLock";

function EditManagerModal({ isOpen, onClose, manager, onSuccess }) {
  useScrollLock(isOpen);
  const [formData, setFormData] = useState({ fullName: "", email: "" });
  const [originalData, setOriginalData] = useState({ fullName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Track whether anything has changed
  const hasChanges = formData.fullName !== originalData.fullName || formData.email !== originalData.email;

  // Pre-fill the form when a manager is selected
  useEffect(() => {
    if (manager) {
      const data = { fullName: manager.fullName, email: manager.email };
      setFormData(data);
      setOriginalData(data);
    }
  }, [manager]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    const nameErr = validatePersonName(formData.fullName);
    if (nameErr) { setFieldErrors((p) => ({ ...p, fullName: nameErr })); return; }
    
    const emailErr = validateEmail(formData.email);
    if (emailErr) { setFieldErrors((p) => ({ ...p, email: emailErr })); return; }
    
    setLoading(true);
    try {
      await projectManagerService.update(manager.userId, formData);
      onSuccess();
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      else alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <FaEdit className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit Manager</h2>
                <p className="text-xs text-slate-500">Update account details</p>
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
            <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <input
              className={"w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.fullName ? " border-red-500 ring-1 ring-red-500" : "")}
              value={formData.fullName}
              maxLength={30}
              onInput={handleNameInput}
              onChange={(e) => {
                setFormData({...formData, fullName: e.target.value});
                setFieldErrors({...fieldErrors, fullName: ""});
              }}
              placeholder="Full Name"
            />
            {fieldErrors.fullName && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.fullName}</p>}
          </div>
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <input
              className={"w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none" + (fieldErrors.email ? " border-red-500 ring-1 ring-red-500" : "")}
              type="email"
              maxLength={50}
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                setFieldErrors({...fieldErrors, email: ""});
              }}
              placeholder="Email Address"
            />
            {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.email}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] w-full rounded-xl bg-linear-to-r from-blue-500 to-sky-600 py-3.5 text-sm font-bold
              text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <FaSpinner className="animate-spin mx-auto" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
export default EditManagerModal;
