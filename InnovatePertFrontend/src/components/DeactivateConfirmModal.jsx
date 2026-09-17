import { useState } from "react";
import { FaTimes, FaSpinner, FaUserSlash, FaCheckCircle } from "react-icons/fa";
import { projectManagerService } from "../services/projectManagerService";
import useScrollLock from "../utils/useScrollLock";

function DeactivateConfirmModal({ isOpen, onClose, manager, onSuccess }) {
  useScrollLock(isOpen);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !manager) return null;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await projectManagerService.deactivate(manager.userId);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <FaUserSlash className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Deactivate Manager?</h2>
                <p className="text-xs text-slate-500">They won't be able to access the platform</p>
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

        <div className="p-7">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
            bg-amber-50 text-amber-500 ring-8 ring-amber-50">
            <FaUserSlash size={22} />
          </div>
          <p className="text-center text-sm leading-relaxed text-slate-500">
            Are you sure you want to deactivate{" "}
            <span className="font-bold text-slate-800">{manager.fullName}</span>?
            They will lose access to all assigned projects until reactivated.
          </p>

          <div className="mt-7 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600
                transition hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold
                text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:-translate-y-0.5
                hover:bg-amber-600 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
            >
              {loading ? <FaSpinner className="animate-spin" /> : "Deactivate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeactivateConfirmModal;
