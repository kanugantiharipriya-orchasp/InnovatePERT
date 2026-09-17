import { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaBriefcase,
  FaCalendarAlt,
  FaDollarSign,
  FaUserPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import { projectService } from "../services/projectService";
import useScrollLock from "../utils/useScrollLock";
import { validateProjectName, validateDescription, validatePositiveNumber, handleTextInput, handleNumberInput, blockInvalidNumberKeys } from "../utils/validation";

function AssignProjectModal({ isOpen, onClose, manager, onSuccess }) {
  useScrollLock(isOpen);
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    startDate: getToday(),
    targetDate: "",
    priority: "MEDIUM",
    budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen || !manager) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const errs = {};
    if (!formData.projectName || !formData.projectName.trim()) {
      errs.projectName = "Project Name is required";
    } else {
      const stack = [];
      let bracketsValid = true;
      for (let char of formData.projectName) {
        if (char === '(' || char === '[' || char === '{') stack.push(char);
        else if (char === ')' || char === ']' || char === '}') {
          if (stack.length === 0) { bracketsValid = false; break; }
          const last = stack.pop();
          if ((char === ')' && last !== '(') ||
              (char === ']' && last !== '[') ||
              (char === '}' && last !== '{')) {
            bracketsValid = false;
            break;
          }
        }
      }
      if (stack.length > 0) bracketsValid = false;

      if (!bracketsValid) {
        errs.projectName = "Project Name contains unmatched brackets";
      } else if (!/^[a-zA-Z0-9 _&.()\[\]{}/#+\-]+$/.test(formData.projectName)) {
        errs.projectName = "Project Name contains invalid characters";
      }
    }

    const descErr = validateDescription(formData.description, true);
    if (descErr) errs.description = descErr;
    
    if (!formData.startDate) {
      errs.startDate = "Start Date is required";
    }
    
    if (!formData.targetDate) {
      errs.targetDate = "Target Date is required";
    } else if (formData.startDate && new Date(formData.targetDate) < new Date(formData.startDate)) {
      errs.targetDate = "Invalid Target Date (cannot be before Start Date)";
    }

    if (!formData.budget) {
      errs.budget = "Budget is required";
    } else {
      const budgetErr = validatePositiveNumber(formData.budget);
      if (budgetErr) errs.budget = budgetErr;
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    setLoading(true);

    try {
      // UPDATE: Pass assignedToId inside the payload to match your new backend DTO
      await projectService.assignProject({
        ...formData,
        budget: parseFloat(formData.budget),
        assignedToId: manager.userId, // <-- This maps to request.getAssignedToId() in Spring
      });

      setFormData({ projectName: "", description: "", startDate: getToday(), targetDate: "", priority: "MEDIUM", budget: "" });
      setShowWarning(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in duration-200 lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
        {/* Header */}
        <div className="border-b border-slate-200 px-7 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <FaUserPlus size={14} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Assign Project</h2>
                <p className="text-xs text-slate-500">
                  Assigning to{" "}
                  <span className="font-bold text-slate-700">
                    {manager.fullName}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400
                transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              title="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-7">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {showWarning ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                <h3 className="mb-2 flex items-center gap-2 text-base font-bold">
                  <FaExclamationTriangle className="text-amber-500" />
                  Important: Please Verify Project Details
                </h3>
                <p className="mb-3 text-sm leading-relaxed">
                  Please make sure that all project details, including the Start Date, Target Date, assigned resources, and other information, are correct before assigning the project.
                </p>
                <p className="mb-4 text-sm leading-relaxed font-semibold">
                  Once the project status is changed to <span className="font-bold">In Progress</span>, the project details <span className="underline">cannot be updated</span> and the <span className="font-bold">Update</span> option will no longer be available.
                </p>
                <p className="text-sm font-bold">
                  Are you sure you want to assign this project with the entered details?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWarning(false)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-300/40 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Assigning...
                    </>
                  ) : (
                    "Confirm & Assign"
                  )}
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Project Name
              </label>
              <div className="relative">
                <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                <input type="text" name="projectName" value={formData.projectName} onInput={handleTextInput} onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, projectName: undefined })); }} disabled={loading}
                  placeholder="Enter project name"
                  className={`w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.projectName ? 'border-red-300 ring-red-100' : ''}`}
                />
              </div>
              {fieldErrors.projectName && <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.projectName}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
              <textarea name="description" value={formData.description} onInput={handleTextInput} onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, description: undefined })); }} disabled={loading}
                rows="3" placeholder="Short description of the project"
                className={`w-full resize-none rounded-xl bg-white border border-slate-200 p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.description ? 'border-red-300 ring-red-100' : ''}`} />
              {fieldErrors.description && <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Start Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input type="date" name="startDate" value={formData.startDate} min={getToday()} onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, startDate: undefined })); }} disabled={loading}
                    className={`w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.startDate ? 'border-red-300 ring-red-100' : ''}`} />
                </div>
                {fieldErrors.startDate && <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.startDate}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Target Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    min={formData.startDate || getToday()}
                    onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, targetDate: undefined })); }}
                    disabled={loading}
                    className={`w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.targetDate ? 'border-red-300 ring-red-100' : ''}`}
                  />
                </div>
                {fieldErrors.targetDate && <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.targetDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Budget
                </label>
                <div className="relative">
                  <input type="number" step="0.01" name="budget" value={formData.budget} onInput={handleNumberInput} onKeyDown={blockInvalidNumberKeys} onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, budget: undefined })); }} disabled={loading}
                    placeholder="0.00"
                    className={`w-full rounded-xl bg-white border border-slate-200 py-3 px-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.budget ? 'border-red-300 ring-red-100' : ''}`}
                  />
                </div>
                {fieldErrors.budget && <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.budget}</p>}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100/80 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition
                  hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r
                  from-blue-500 to-sky-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/40
                  transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Assigning...
                  </>
                ) : (
                  "Assign Project"
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignProjectModal;
