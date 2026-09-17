import {
  FaPlus,
  FaPen,
  FaSave,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { handleTextInput, handleNumberInput, blockInvalidNumberKeys } from "../../utils/validation";

// Reusable New / Edit Project form — rendered inside a popup modal.
// Pure presentational component; all state lives in the parent.
function ProjectForm({
  formData,
  isEditing,
  error,
  fieldErrors = {},
  saving,
  disabled = false,
  onChange,
  onSave,
  onCancel,
  hideStatus,
}) {
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl shadow-2xl shadow-slate-300/40">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            {isEditing ? <FaPen size={14} /> : <FaPlus size={16} />}
          </span>
          <div>
            <h2 className="text-lg font-black leading-tight text-slate-900">
              {isEditing ? "Edit Project" : "New Project"}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? "Update the project details below"
                : "Create a new project entry for your portfolio"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          title="Close"
        >
          <FaTimes />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            <FaExclamationTriangle className="shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onInput={handleTextInput}
              onChange={onChange}
              placeholder="e.g. ERP Implementation"
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full rounded-xl p-3 text-slate-800" + (fieldErrors.projectName ? " border-red-500 ring-1 ring-red-500" : "")}
            />
            {fieldErrors.projectName && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.projectName}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              name="description"
              value={formData.description}
              onInput={handleTextInput}
              onChange={onChange}
              placeholder="Brief description of the project scope..."
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full rounded-xl p-3 text-slate-800" + (fieldErrors.description ? " border-red-500 ring-1 ring-red-500" : "")}
            />
            {fieldErrors.description && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.description}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Budget (₹)
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onInput={handleNumberInput}
              onKeyDown={blockInvalidNumberKeys}
              onChange={onChange}
              placeholder="0"
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full rounded-xl p-3 text-slate-800" + (fieldErrors.budget ? " border-red-500 ring-1 ring-red-500" : "")}
            />
            {fieldErrors.budget && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.budget}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={onChange}
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full cursor-pointer rounded-xl p-3 text-slate-800" + (fieldErrors.priority ? " border-red-500 ring-1 ring-red-500" : "")}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            {fieldErrors.priority && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.priority}</p>}
          </div>

          {!hideStatus && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={onChange}
                className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full cursor-pointer rounded-xl p-3 text-slate-800" + (fieldErrors.status ? " border-red-500 ring-1 ring-red-500" : "")}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              {fieldErrors.status && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.status}</p>}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              min={getToday()}
              value={formData.startDate}
              onChange={onChange}
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full rounded-xl p-3 text-slate-800" + (fieldErrors.startDate ? " border-red-500 ring-1 ring-red-500" : "")}
            />
            {fieldErrors.startDate && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.startDate}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Target Date
            </label>
            <input
              type="date"
              name="targetDate"
              min={formData.startDate || getToday()}
              value={formData.targetDate}
              onChange={onChange}
              className={"bg-white border border-slate-200 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none w-full rounded-xl p-3 text-slate-800" + (fieldErrors.targetDate ? " border-red-500 ring-1 ring-red-500" : "")}
            />
            {fieldErrors.targetDate && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.targetDate}</p>}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/60 bg-slate-50/60 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] cursor-pointer rounded-xl border border-slate-200/60 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || disabled}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-300/40 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSave size={13} />
          {saving ? "Saving…" : isEditing ? "Update Project" : "Create Project"}
        </button>
      </div>
    </div>
  );
}

export default ProjectForm;
