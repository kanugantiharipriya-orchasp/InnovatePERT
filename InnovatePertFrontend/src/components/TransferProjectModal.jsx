import { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaUser,
} from "react-icons/fa";
import { projectService } from "../services/projectService";
import useScrollLock from "../utils/useScrollLock";

function TransferProjectModal({ isOpen, onClose, project, managers, onSuccess }) {
  useScrollLock(isOpen);

  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !project) return null;

  // Filter out the current project manager
  const eligibleManagers = managers.filter(
    (m) => m.userId !== project.assignedToId
  );
  
  const currentPMName = project.pmName || "Unassigned";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedManagerId) {
      setError("Please select a new Project Manager.");
      return;
    }

    setLoading(true);

    try {
      const pId = project.projectId ?? project.id;
      await projectService.transferProject(pId, selectedManagerId);
      setSelectedManagerId("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to transfer project.");
    } finally {
      setLoading(false);
    }
  };

  const selectedManager = managers.find((m) => m.userId === parseInt(selectedManagerId));
  const newPMName = selectedManager ? selectedManager.fullName : "[New Project Manager]";

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in duration-200 lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
        {/* Header */}
        <div className="border-b border-slate-200 px-7 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-500">
                <FaExchangeAlt size={14} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Transfer Project</h2>
                <p className="text-xs text-slate-500">
                  Transferring{" "}
                  <span className="font-bold text-slate-700">
                    {project.projectName}
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

          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold">
                <FaExclamationTriangle className="text-amber-500" />
                Confirm Project Transfer
              </h3>
              <p className="mb-3 text-sm leading-relaxed">
                You are about to transfer <span className="font-bold">{project.projectName}</span> from <span className="font-bold">{currentPMName}</span> to <span className="font-bold">{newPMName}</span>.
              </p>
              <p className="mb-4 text-sm leading-relaxed">
                After the transfer, <span className="font-bold">{newPMName}</span> will have access to the complete project and its existing activities. <span className="font-bold">{currentPMName}</span> will no longer have access to this project.
              </p>
              <p className="mb-4 text-sm leading-relaxed">
                Please verify the details carefully before confirming the transfer.
              </p>
              <p className="text-sm font-bold">
                Are you sure you want to continue?
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select New Project Manager <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaUser className="text-slate-400" />
                  </div>
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pl-10 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-400/10 cursor-pointer"
                  >
                    <option value="" disabled>Select a manager...</option>
                    {eligibleManagers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedManagerId}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-bold text-white shadow-lg shadow-violet-300/40 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Transferring...
                    </>
                  ) : (
                    "Confirm Transfer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferProjectModal;
