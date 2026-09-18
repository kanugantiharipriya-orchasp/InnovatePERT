import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { handleTextInput, handleNumberInput, blockInvalidNumberKeys } from "../utils/validation";
import useScrollLock from "../utils/useScrollLock";

function ActivityModal({ isOpen, onClose, projects, onActivityCreated }) {
  useScrollLock(isOpen);
  const [formData, setFormData] = useState({
    activityName: "",
    projectId: "",
    optimisticTime: "",
    mostLikelyTime: "",
    pessimisticTime: "",
    expectedTime: "",
    crashTime: "",
    normalCost: "",
    crashCost: "",
    dependencyType: "NO_DEPENDENCY",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [pertErrors, setPertErrors] = useState({
    mostLikelyTime: "",
    pessimisticTime: "",
    general: "",
  });

  // Auto-calculate expected time using PERT formula and validate
  useEffect(() => {
    const oRaw = formData.optimisticTime;
    const mRaw = formData.mostLikelyTime;
    const pRaw = formData.pessimisticTime;

    const newPertErrors = { mostLikelyTime: "", pessimisticTime: "", general: "" };
    
    // Only validate if values are entered
    if (oRaw !== "" && mRaw !== "") {
      if (parseFloat(mRaw) <= parseFloat(oRaw)) {
        newPertErrors.mostLikelyTime = "Most Likely Time must be strictly greater than Optimistic Time.";
      }
    }
    
    if (mRaw !== "" && pRaw !== "") {
      if (parseFloat(pRaw) <= parseFloat(mRaw)) {
        newPertErrors.pessimisticTime = "Pessimistic Time must be strictly greater than Most Likely Time.";
      }
    } else if (oRaw !== "" && pRaw !== "") {
      if (parseFloat(pRaw) <= parseFloat(oRaw)) {
        newPertErrors.pessimisticTime = "Pessimistic Time must be strictly greater than Optimistic Time.";
      }
    }

    let isValidPert = true;
    if (oRaw !== "" && mRaw !== "" && pRaw !== "") {
      const o = parseFloat(oRaw);
      const m = parseFloat(mRaw);
      const p = parseFloat(pRaw);
      if (!(o < m && m < p)) {
        isValidPert = false;
        if (!newPertErrors.mostLikelyTime && !newPertErrors.pessimisticTime) {
          newPertErrors.general = "PERT values must satisfy: Optimistic Time < Most Likely Time < Pessimistic Time.";
        }
      }
    }

    setPertErrors(newPertErrors);

    // Expected Time Calculation
    if (oRaw !== "" && mRaw !== "" && pRaw !== "" && isValidPert) {
      const o = parseFloat(oRaw);
      const m = parseFloat(mRaw);
      const p = parseFloat(pRaw);

      if (o >= 0 && m >= 0 && p >= 0 && o < m && m < p) {
        const expected = ((o + 4 * m + p) / 6).toFixed(2);
        setFormData((prev) => prev.expectedTime !== expected ? { ...prev, expectedTime: expected } : prev);
      } else {
        setFormData((prev) => prev.expectedTime !== "" ? { ...prev, expectedTime: "" } : prev);
      }
    } else {
      setFormData((prev) => prev.expectedTime !== "" ? { ...prev, expectedTime: "" } : prev);
    }
  }, [formData.optimisticTime, formData.mostLikelyTime, formData.pessimisticTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDependencyChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      dependencyType: e.target.value,
    }));
  };

  const hasPertError = !!(pertErrors.mostLikelyTime || pertErrors.pessimisticTime || pertErrors.general);

  const validateForm = () => {
    const errs = {};
    if (!formData.activityName.trim()) errs.activityName = "Activity Name is required";
    if (!formData.projectId) errs.projectId = "Project is required";
    if (!formData.optimisticTime) errs.optimisticTime = "Optimistic Time is required";
    if (!formData.mostLikelyTime) errs.mostLikelyTime = "Most Likely Time is required";
    if (!formData.pessimisticTime) errs.pessimisticTime = "Pessimistic Time is required";
    if (!formData.normalCost) errs.normalCost = "Normal Cost is required";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return false;

    const o = parseFloat(formData.optimisticTime);
    const m = parseFloat(formData.mostLikelyTime);
    const p = parseFloat(formData.pessimisticTime);

    if (isNaN(o) || isNaN(m) || isNaN(p) || o < 0 || m < 0 || p < 0) {
      setError("Time estimates cannot be negative");
      return false;
    }

    if (!(o <= m && m <= p)) {
      setError("Optimistic Time must be <= Most Likely Time and Most Likely Time must be <= Pessimistic Time.");
      return false;
    }

    const expectedTime = parseFloat(((o + 4 * m + p) / 6).toFixed(2));

    const hasCrashTime = formData.crashTime !== "" && formData.crashTime !== null && formData.crashTime !== undefined;
    const hasCrashCost = formData.crashCost !== "" && formData.crashCost !== null && formData.crashCost !== undefined;

    if (hasCrashTime) {
      const ct = parseFloat(formData.crashTime);
      if (isNaN(ct)) {
        setError("Crash Time must be a valid number");
        return false;
      }
      if (ct >= expectedTime) {
        setError(`Crash Time must be less than the calculated Expected Time (${expectedTime} days).`);
        return false;
      }
      if (!hasCrashCost) {
        setError("Crash Cost is mandatory when Crash Time is provided.");
        return false;
      }
      const cc = parseFloat(formData.crashCost);
      const nc = parseFloat(formData.normalCost);
      if (isNaN(cc) || cc <= nc) {
        setError("Crash Cost must be greater than Normal Cost.");
        return false;
      }
    } else {
      if (hasCrashCost) {
        setError("Crash Cost cannot be provided without Crash Time.");
        return false;
      }
    }

    if (hasPertError) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const payload = {
        activityName: formData.activityName,
        projectId: parseInt(formData.projectId, 10),
        optimisticTime: parseFloat(formData.optimisticTime),
        mostLikelyTime: parseFloat(formData.mostLikelyTime),
        pessimisticTime: parseFloat(formData.pessimisticTime),
        normalCost: parseFloat(formData.normalCost),
        dependencyType: formData.dependencyType,
      };

      if (formData.crashTime !== "" && formData.crashTime !== null && formData.crashTime !== undefined) {
        payload.crashTime = parseFloat(formData.crashTime);
        payload.crashCost = parseFloat(formData.crashCost);
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${apiBase}/api/v1/activities`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to create activity";

        if (response.status === 403) {
          errorMessage =
            "Access denied. You do not have permission to create activities.";
        } else if (response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = `Failed to create activity (${response.status})`;
          }
        }

        throw new Error(errorMessage);
      }

      const newActivity = await response.json();

      // Reset form
      setFormData({
        activityName: "",
        projectId: "",
        optimisticTime: "",
        mostLikelyTime: "",
        pessimisticTime: "",
        expectedTime: "",
        normalCost: "",
        crashCost: "",
        dependencyType: "NO_DEPENDENCY",
      });

      setError("");

      // Call callback to notify parent component
      if (onActivityCreated) {
        onActivityCreated(newActivity);
      }

      onClose();
    } catch (err) {
      setError(err.message || "An error occurred while creating the activity");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] lg:translate-x-[calc(var(--sidebar-w,16rem)/2)]">
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"
        >
          <h2 className="text-lg font-bold text-slate-900">New Activity</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400
              hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50 cursor-pointer"
            title="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {(error || pertErrors.general) && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error || pertErrors.general}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Activity Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Activity Name
              </label>
              <input
                type="text"
                name="activityName"
                value={formData.activityName}
                onInput={handleTextInput}
                onChange={handleInputChange}
                placeholder="Enter activity name"
                disabled={loading}
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.activityName ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {fieldErrors.activityName && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.activityName}</p>}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Project
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 cursor-pointer ${fieldErrors.projectId ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.projectName}
                  </option>
                ))}
              </select>
              {fieldErrors.projectId && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.projectId}</p>}
            </div>

            {/* Optimistic Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Optimistic Time (days)
              </label>
              <input
                type="number"
                name="optimisticTime"
                value={formData.optimisticTime}
                onInput={handleNumberInput}
                onKeyDown={blockInvalidNumberKeys}
                onChange={handleInputChange}
                placeholder="Enter optimistic time"
                disabled={loading}
                min="0"
                step="0.01"
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.optimisticTime ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {fieldErrors.optimisticTime && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.optimisticTime}</p>}
            </div>

            {/* Most Likely Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Most Likely Time (days)
              </label>
              <input
                type="number"
                name="mostLikelyTime"
                value={formData.mostLikelyTime}
                onInput={handleNumberInput}
                onKeyDown={blockInvalidNumberKeys}
                onChange={handleInputChange}
                placeholder="Enter most likely time"
                disabled={loading}
                min="0"
                step="0.01"
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${(fieldErrors.mostLikelyTime || pertErrors.mostLikelyTime) ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {(fieldErrors.mostLikelyTime || pertErrors.mostLikelyTime) && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.mostLikelyTime || pertErrors.mostLikelyTime}</p>}
            </div>

            {/* Pessimistic Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pessimistic Time (days)
              </label>
              <input
                type="number"
                name="pessimisticTime"
                value={formData.pessimisticTime}
                onInput={handleNumberInput}
                onKeyDown={blockInvalidNumberKeys}
                onChange={handleInputChange}
                placeholder="Enter pessimistic time"
                disabled={loading}
                min="0"
                step="0.01"
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${(fieldErrors.pessimisticTime || pertErrors.pessimisticTime) ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {(fieldErrors.pessimisticTime || pertErrors.pessimisticTime) && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.pessimisticTime || pertErrors.pessimisticTime}</p>}
            </div>

            {/* Expected Time (Read-only, auto-calculated) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Expected Time (days)
              </label>
              <input
                type="number"
                value={formData.expectedTime}
                placeholder="Auto-calculated"
                disabled
                className="w-full rounded-lg border border-slate-200/60 bg-slate-100/50 px-4 py-3 outline-none text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Auto-calculated: (O + 4×M + P) / 6
              </p>
            </div>

            {/* Normal Cost */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Normal Cost ($)
              </label>
              <input
                type="number"
                name="normalCost"
                value={formData.normalCost}
                onInput={handleNumberInput}
                onKeyDown={blockInvalidNumberKeys}
                onChange={handleInputChange}
                placeholder="Enter normal cost"
                disabled={loading}
                min="0"
                step="0.01"
                className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${fieldErrors.normalCost ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {fieldErrors.normalCost && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.normalCost}</p>}
            </div>

            {/* Crash Cost */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Crash Cost ($)
              </label>
              <input
                type="number"
                name="crashCost"
                value={formData.crashCost}
                onInput={handleNumberInput}
                onKeyDown={blockInvalidNumberKeys}
                onChange={handleInputChange}
                placeholder="Enter crash cost"
                disabled={loading}
                min="0"
                step="0.01"
                className="w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Dependency Type */}
          <div className="mt-6 rounded-lg bg-white border border-slate-200/90 p-4 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)]">
            <label className="block text-sm font-semibold text-slate-700 mb-4">
              Dependency Type
            </label>
            <div className="flex gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dependencyType"
                  value="NO_DEPENDENCY"
                  checked={formData.dependencyType === "NO_DEPENDENCY"}
                  onChange={handleDependencyChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
                <span className="text-slate-700">No Dependency</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dependencyType"
                  value="HAS_DEPENDENCY"
                  checked={formData.dependencyType === "HAS_DEPENDENCY"}
                  onChange={handleDependencyChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
                <span className="text-slate-700">Has Dependency</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-lg bg-white border border-slate-200/60 px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hasPertError}
              className="rounded-lg bg-linear-to-r from-blue-500 to-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-300/40 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer transition"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivityModal;
