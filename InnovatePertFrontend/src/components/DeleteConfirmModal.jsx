import { useState } from "react";
import { FaTimes, FaSpinner, FaExclamationTriangle, FaUserSlash } from "react-icons/fa";
import { projectManagerService } from "../services/projectManagerService";
import useScrollLock from "../utils/useScrollLock";

function DeleteConfirmModal({ isOpen, onClose, manager, onSuccess }) {
  useScrollLock(isOpen);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !manager) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await projectManagerService.softDelete(manager.userId);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
      <div className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] text-center lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <FaUserSlash className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delete Manager?</h2>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
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
            bg-linear-to-br from-rose-100 to-red-100 text-rose-600 ring-8 ring-rose-50">
            <FaExclamationTriangle size={22} />
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-800">{manager.fullName}</span>?
            The account will be permanently removed.
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
              onClick={handleDelete}
              disabled={loading}
              className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r
                from-rose-500 to-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-300/40
                transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 cursor-pointer"
            >
              {loading ? <FaSpinner className="animate-spin" /> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
