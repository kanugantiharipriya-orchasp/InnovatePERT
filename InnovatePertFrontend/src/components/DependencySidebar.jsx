import { useEffect, useState } from "react";
import { FaTimes, FaProjectDiagram, FaArrowRight } from "react-icons/fa";
import useScrollLock from "../utils/useScrollLock";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["content", "data", "items", "list", "dependencies"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

function DependencySidebar({ isOpen, onClose, projectId, projectName }) {
  useScrollLock(isOpen);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function fetchDeps() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/v1/dependencies/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(res.status);
        const raw = await res.json();
        setDependencies(normalizeList(raw));
      } catch (err) {
        console.error("DependencySidebar fetch error:", err);
        setDependencies([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDeps();
  }, [isOpen, projectId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md
          bg-white shadow-2xl transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl
              bg-gradient-to-br from-blue-500 to-blue-500 text-white shadow-md">
              <FaProjectDiagram size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Dependencies</p>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {projectName ?? `Project #${projectId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl
              text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-400 border-t-transparent" />
            </div>
          ) : dependencies.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <FaProjectDiagram size={28} className="text-slate-200" />
              <p className="text-sm">No dependencies found for this project.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                {dependencies.length} dependenc{dependencies.length === 1 ? "y" : "ies"}
              </p>

              {dependencies.map((d, i) => {
                const successor   = d.successorActivityName   ?? d.activityName   ?? "—";
                const predecessor = d.predecessorActivityName ?? d.predecessorName ?? "—";
                const depType     = d.dependencyType ?? "";

                return (
                  <div key={d.dependencyId ?? i}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 hover:bg-slate-100/80 transition">
                    {/* Successor */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl
                        bg-gradient-to-br from-blue-500 to-blue-500 text-white text-xs font-black shadow">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-700 truncate">{successor}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-slate-400">
                          <FaArrowRight size={9} />
                          <p className="text-xs text-slate-500 truncate">{predecessor}</p>
                        </div>
                        {depType && (
                          <span className="mt-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5
                            text-[10px] font-bold text-blue-600">
                            {depType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DependencySidebar;
