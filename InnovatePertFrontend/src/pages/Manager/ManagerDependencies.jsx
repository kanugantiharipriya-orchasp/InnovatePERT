import { useState, useEffect, useCallback } from "react";
import useScrollLock from "../../utils/useScrollLock";
import {
  FaTable,
  FaProjectDiagram,
  FaLink,
  FaPlus,
  FaTimes,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
  FaInfoCircle,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of [
    "content",
    "data",
    "items",
    "result",
    "list",
    "dependencies",
    "activities",
  ]) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (
    data.data &&
    typeof data.data === "object" &&
    Array.isArray(data.data.content)
  ) {
    return data.data.content;
  }
  return [];
};

const getToken = () => localStorage.getItem("token");

function ManagerDependencies({ initialProjectId, embedded, targetActivityName }) {
  const [view, setView] = useState("table");
  const [search, setSearch] = useState(targetActivityName || "");

  // Projects & Activities
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activities, setActivities] = useState([]);

  // Dependencies
  const [dependencies, setDependencies] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);

  // New Dependency Modal
  const [showModal, setShowModal] = useState(false);
  useScrollLock(showModal);
  const [depMode, setDepMode] = useState("ACTIVITY"); // "ACTIVITY" or "PROJECT"
  const [predProjectId, setPredProjectId] = useState("");
  const [predActivityId, setPredActivityId] = useState("");
  const [succActivityId, setSuccActivityId] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── fetch projects ────────────────────────────────────────────────────────
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(res.status);
      const list = normalizeList(await res.json());
      setProjects(list);
      if (list.length > 0) {
        const preferred = list.find(
          (p) => String(p.projectId) === String(initialProjectId),
        );
        setSelectedProject(
          preferred ? String(preferred.projectId) : String(list[0].projectId),
        );
      }
    } catch (e) {
      console.error("fetchProjects:", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  // ── fetch activities for selected project ─────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!selectedProject) {
      setActivities([]);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/activities/project/${selectedProject}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) {
        setActivities(normalizeList(await res.json()));
      }
    } catch (e) {
      console.error("fetchActivities:", e);
    }
  }, [selectedProject]);

  // ── fetch dependencies ──────────────────────────────────────────────────
  const fetchDependencies = useCallback(async () => {
    if (!selectedProject) {
      setDependencies([]);
      return;
    }
    setLoadingDeps(true);
    try {
      const depRes = await fetch(
        `${API_BASE_URL}/api/v1/dependencies/project/${selectedProject}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      if (depRes.ok) {
        const raw = await depRes.json();
        setDependencies(normalizeList(raw));
      } else {
        setDependencies([]);
      }
    } catch (e) {
      console.error("fetchDependencies:", e);
      setDependencies([]);
    } finally {
      setLoadingDeps(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchDependencies();
  }, [fetchActivities, fetchDependencies]);

  // ── submit new dependency ────────────────────────────────────────────────
  const handleCreateDependency = async (e) => {
    e.preventDefault();
    setFormError("");

    if (depMode === "PROJECT") {
      if (!predProjectId) {
        setFormError("Please select a prerequisite predecessor project.");
        return;
      }
      if (String(predProjectId) === String(selectedProject)) {
        setFormError("A project cannot depend on itself.");
        return;
      }
    } else {
      if (!predActivityId || !succActivityId) {
        setFormError(
          "Please select both predecessor and successor activities.",
        );
        return;
      }
      if (String(predActivityId) === String(succActivityId)) {
        setFormError("An activity cannot depend on itself.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId: parseInt(selectedProject, 10),
        dependencyType: "FS",
        ...(depMode === "PROJECT"
          ? { predecessorProjectId: parseInt(predProjectId, 10) }
          : {
              predecessorActivityId: parseInt(predActivityId, 10),
              successorActivityId: parseInt(succActivityId, 10),
            }),
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/dependencies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to create dependency";
        try {
          const d = await res.json();
          msg = typeof d === "string" ? d : d.message || msg;
        } catch {
          /* ignore */
        }
        setFormError(msg);
        return;
      }

      setShowModal(false);
      setPredProjectId("");
      setPredActivityId("");
      setSuccActivityId("");
      await fetchDependencies();
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete dependency ─────────────────────────────────────────────────────
  const handleDeleteDependency = async (id) => {
    if (!window.confirm("Remove this dependency link?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/dependencies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        await fetchDependencies();
      } else {
        alert("Failed to delete dependency.");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const displayed = dependencies.filter((d) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const succ = (d.successorActivityName ?? "").toLowerCase();
    const pred = (
      d.predecessorActivityName ??
      d.predecessorProjectName ??
      ""
    ).toLowerCase();
    return succ.includes(q) || pred.includes(q);
  });

  const blockedList = displayed.filter((d) => {
    if (!d.isBlocked) return false;
    if (embedded && targetActivityName) {
      const succ = (d.successorActivityName ?? "").toLowerCase();
      return succ === targetActivityName.toLowerCase();
    }
    return true;
  });

  // ── build diagram chain ──────────────────────────────────────────────────
  const buildChain = () => {
    const predMap = new Map();
    const allNames = new Set();

    dependencies.forEach((d) => {
      const succ = d.successorActivityName ?? "Project Start";
      const pred =
        d.predecessorActivityName ||
        (d.predecessorProjectName
          ? `[Project] ${d.predecessorProjectName}`
          : "Start");
      if (succ) {
        predMap.set(succ, pred);
        allNames.add(succ);
      }
      if (pred) allNames.add(pred);
    });

    const sorted = [];
    const visited = new Set();

    const visit = (name) => {
      if (visited.has(name)) return;
      visited.add(name);
      const pred = predMap.get(name);
      if (pred) visit(pred);
      sorted.push(name);
    };

    for (const name of allNames) visit(name);
    return sorted;
  };

  const chainNodes = buildChain();

  const buildActivityDiagram = () => {
    if (!targetActivityName) return { predecessors: [], target: "", successors: [] };
    const preds = new Set();
    const succs = new Set();
    
    dependencies.forEach((d) => {
      const sName = d.successorActivityName ?? "Project Start";
      const pName = d.predecessorActivityName ||
        (d.predecessorProjectName ? `[Project] ${d.predecessorProjectName}` : "Start");
        
      if (sName.toLowerCase() === targetActivityName.toLowerCase()) {
        preds.add(pName);
      }
      if (pName.toLowerCase() === targetActivityName.toLowerCase()) {
        succs.add(sName);
      }
    });
    
    return {
      predecessors: Array.from(preds),
      target: targetActivityName,
      successors: Array.from(succs)
    };
  };
  const activityGraph = buildActivityDiagram();

  const currentProjectObj = projects.find(
    (p) => String(p.projectId) === String(selectedProject),
  );

  return (
    <div className={embedded ? "p-6" : "min-h-screen p-6"}>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {!loadingDeps && displayed.length > 0 && (
            <span className="ml-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
              {displayed.length} link{displayed.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {!embedded && (
          <button
            onClick={() => {
              setFormError("");
              setShowModal(true);
            }}
            className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] flex cursor-pointer items-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:-translate-y-0.5"
          >
            <FaPlus /> Add Dependency
          </button>
        )}
      </div>

      {/* ── Blocked Projects Warning Banner ── */}
      {blockedList.length > 0 && (
        <div className="mb-6 rounded-3xl border-l-4 border-amber-500 bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] p-5">
          <div className="flex items-center gap-3 text-amber-800">
            <FaExclamationTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-bold">
                Blocked Dependencies Detected ({blockedList.length})
              </h3>
              <p className="text-xs text-amber-700">
                The following projects or activities have active incomplete
                prerequisites preventing progress:
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {blockedList.map((b) => (
              <div
                key={b.dependencyId}
                className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{b.projectName}</span>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] text-amber-800">
                    Blocked
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{b.blockReason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Project dropdown */}
        {!embedded && (
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={loadingProjects}
            className="w-64 cursor-pointer appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-4 pr-10 text-sm font-medium text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
          >
            {loadingProjects ? (
              <option>Loading…</option>
            ) : (
              projects.map((p) => (
                <option key={p.projectId} value={String(p.projectId)}>
                  {p.projectName}
                </option>
              ))
            )}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        )}

        {/* Search */}
        {!embedded && (
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search dependencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200 py-2.5 pl-11 pr-4 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
          />
        </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] p-1">
          <button
            onClick={() => setView("table")}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "table"
                ? "bg-linear-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-300/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FaTable className="h-3.5 w-3.5" /> Table View
          </button>
          {embedded && (
            <button
              onClick={() => setView("activity_diagram")}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "activity_diagram"
                  ? "bg-linear-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-300/40"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FaProjectDiagram className="h-3.5 w-3.5" /> Activity Diagram
            </button>
          )}
          <button
            onClick={() => setView("project_diagram")}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "project_diagram"
                ? "bg-linear-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-300/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FaProjectDiagram className="h-3.5 w-3.5" /> Project Diagram
          </button>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {view === "table" && (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
          <table className="w-full text-sm">
            <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
              <tr className="text-left">
                <th className="px-6 py-4">Relationship Sentence</th>
                <th className="px-6 py-4">Prerequisite</th>
                <th className="px-6 py-4">Dependent Target</th>
                <th className="px-6 py-4">Status & Reason</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {loadingDeps ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <span>Loading dependencies…</span>
                    </div>
                  </td>
                </tr>
              ) : !selectedProject ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <p className="text-base font-semibold">
                      Please select a project to view dependencies.
                    </p>
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <p className="text-base font-semibold">
                      No dependencies found for this project.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Click "+ Add Dependency" above to define workflow rules.
                    </p>
                  </td>
                </tr>
              ) : (
                displayed.map((d) => {
                  const predName =
                    d.predecessorActivityName ||
                    (d.predecessorProjectName
                      ? `[Project] ${d.predecessorProjectName}`
                      : "—");
                  const predStatus =
                    d.predecessorActivityStatus ||
                    d.predecessorProjectStatus ||
                    "N/A";
                  const succName =
                    d.successorActivityName || d.projectName || "Project Start";
                  const succStatus =
                    d.successorActivityStatus || d.projectStatus || "N/A";
                  const isBlocked = d.isBlocked;
                  const depStat = (
                    d.dependencyStatus || (isBlocked ? "BLOCKED" : "READY")
                  ).toUpperCase();

                  return (
                    <tr
                      key={d.dependencyId}
                      className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]"
                    >
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {d.relationshipSentence ||
                          `${succName} depends on ${predName}`}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        <div>{predName}</div>
                        <div className="text-[11px] text-slate-500">
                          Status: {predStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        <div>{succName}</div>
                        <div className="text-[11px] text-slate-500">
                          Status: {succStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                              isBlocked
                                ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                                : depStat === "SATISFIED"
                                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                                  : "bg-sky-100 text-sky-700 ring-1 ring-sky-300"
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <FaBan size={9} /> BLOCKED
                              </>
                            ) : depStat === "SATISFIED" ? (
                              <>
                                <FaCheckCircle size={9} /> SATISFIED
                              </>
                            ) : (
                              <>
                                <FaCheckCircle size={9} /> READY
                              </>
                            )}
                          </span>
                          <span className="text-xs text-slate-500">
                            {d.blockReason}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteDependency(d.dependencyId)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition hover:scale-110 hover:bg-rose-100"
                          title="Delete Dependency"
                        >
                          <FaTrash size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PROJECT DIAGRAM VIEW ── */}
      {view === "project_diagram" && (
        <div className="rounded-3xl p-8 bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]">
          <h3 className="mb-4 text-lg font-bold text-slate-800">
            Project Dependency Flowchart: {currentProjectObj?.projectName}
          </h3>
          {chainNodes.length === 0 ? (
            <p className="text-sm text-slate-400">
              No dependency nodes defined.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4 py-6">
              {chainNodes.map((node, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="rounded-2xl border border-slate-200/90 bg-linear-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-300/40">
                    {node}
                  </div>
                  {idx < chainNodes.length - 1 && (
                    <FaArrowRight className="text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY DIAGRAM VIEW ── */}
      {view === "activity_diagram" && embedded && (
        <div className="rounded-3xl p-8 bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]">
          <h3 className="mb-6 text-lg font-bold text-slate-800">
            Activity Dependency View: {activityGraph.target}
          </h3>
          <div className="flex flex-col items-center gap-8 py-4">
            
            {/* Predecessors */}
            {activityGraph.predecessors.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Predecessors</div>
                <div className="flex flex-wrap justify-center gap-4">
                  {activityGraph.predecessors.map((p, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm">
                      {p}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-300 mt-2">
                  <div className="h-6 border-l-2 border-dashed border-slate-300"></div>
                  <FaArrowRight className="rotate-90 text-slate-400" />
                </div>
              </div>
            )}
            
            {/* Target Activity */}
            <div className="flex flex-col items-center gap-2">
               <div className="text-xs font-semibold text-sky-500 uppercase tracking-wide">Selected Activity</div>
               <div className="rounded-2xl border border-sky-400/80 bg-linear-to-r from-sky-600 to-blue-600 px-8 py-5 text-lg font-black text-white shadow-lg shadow-sky-300/40 ring-4 ring-sky-100/50">
                 {activityGraph.target}
               </div>
            </div>

            {/* Successors */}
            {activityGraph.successors.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1 text-slate-300 mt-2">
                  <div className="h-6 border-l-2 border-dashed border-slate-300"></div>
                  <FaArrowRight className="rotate-90 text-slate-400" />
                </div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Successors</div>
                <div className="flex flex-wrap justify-center gap-4">
                  {activityGraph.successors.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activityGraph.predecessors.length === 0 && activityGraph.successors.length === 0 && (
               <p className="text-sm text-slate-400 mt-4">No predecessors or successors found for this activity.</p>
            )}

          </div>
        </div>
      )}

      {/* ── NEW DEPENDENCY MODAL (hidden in embedded mode to avoid nested fixed overlay) ── */}
      {showModal && !embedded && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]">
          <div className="m-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Add New Dependency</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  title="Close"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDependency} className="p-6">
              {formError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}

              {/* Dependency Level Switcher */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dependency Type
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="depMode"
                      value="ACTIVITY"
                      checked={depMode === "ACTIVITY"}
                      onChange={() => setDepMode("ACTIVITY")}
                      className="accent-blue-600"
                    />
                    Activity-to-Activity
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="depMode"
                      value="PROJECT"
                      checked={depMode === "PROJECT"}
                      onChange={() => setDepMode("PROJECT")}
                      className="accent-blue-600"
                    />
                    Project Prerequisite (Project-to-Project)
                  </label>
                </div>
              </div>

              {depMode === "PROJECT" ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Dependent Project (Target)
                    </label>
                    <div className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none">
                      {currentProjectObj?.projectName}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Prerequisite Project (Must complete first){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={predProjectId}
                      onChange={(e) => setPredProjectId(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
                    >
                      <option value="">Select prerequisite project</option>
                      {projects
                        .filter(
                          (p) =>
                            String(p.projectId) !== String(selectedProject),
                        )
                        .map((p) => (
                          <option key={p.projectId} value={p.projectId}>
                            {p.projectName} ({p.status})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Predecessor Activity (Must complete first){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={predActivityId}
                      onChange={(e) => setPredActivityId(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
                    >
                      <option value="">Select predecessor activity</option>
                      {activities.map((a) => (
                        <option
                          key={a.activityId ?? a.id}
                          value={a.activityId ?? a.id}
                        >
                          {a.activityName} ({a.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Successor Activity (Blocked until predecessor finishes){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={succActivityId}
                      onChange={(e) => setSuccActivityId(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
                    >
                      <option value="">Select successor activity</option>
                      {activities.map((a) => (
                        <option
                          key={a.activityId ?? a.id}
                          value={a.activityId ?? a.id}
                        >
                          {a.activityName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] cursor-pointer rounded-lg bg-linear-to-r from-sky-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-300/40 transition hover:-translate-y-0.5"
                >
                  {submitting ? "Saving..." : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDependencies;
