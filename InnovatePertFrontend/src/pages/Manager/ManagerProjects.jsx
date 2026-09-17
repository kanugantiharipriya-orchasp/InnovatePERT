import { useMemo, useState, useEffect } from "react";
import {
  FaSearch,
  FaEye,
  FaTimes,
  FaProjectDiagram,
  FaLink,
  FaEdit,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const normalizePriority = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const formatPriority = (value) => {
  switch (normalizePriority(value)) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
};

const normalizeProjectsResponse = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const candidates = [
    data.content,
    data.data,
    data.projects,
    data.items,
    data.result,
    data.projectList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(data.content?.content)) {
    return data.content.content;
  }

  if (data.project) {
    return [data.project];
  }

  return [];
};

function Projects() {
  // -----------------------------
  //  Fetch Data
  // -----------------------------

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------
  //  States
  // -----------------------------

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProject, setSelectedProject] = useState(null);
  const [statusUpdateProject, setStatusUpdateProject] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false); // -----------------------------
  //  Fetch
  // -----------------------------

  const fetchProjects = async (opts = {}) => {
    const silent = !!opts?.silent;
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json().catch(() => null);
      const normalizedProjects = normalizeProjectsResponse(data);

      setProjects(normalizedProjects);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    let data = [...projects];

    if (search.trim() !== "") {
      const searchText = search.trim().toLowerCase();
      data = data.filter((item) => {
        const searchableText = [
          item?.projectName,
          item?.activityName,
          item?.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchText);
      });
    }

    if (priorityFilter !== "") {
      data = data.filter(
        (item) => normalizePriority(item?.priority) === priorityFilter,
      );
    }

    if (statusFilter !== "") {
      data = data.filter(
        (item) => normalizeStatus(item?.status) === statusFilter,
      );
    }

    return data;
  }, [projects, search, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / 5));

  // Clamp the page when filters shrink the list (search/filter on a deep page)
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProjects = useMemo(() => {
    const startIndex = (safePage - 1) * 5;
    return filteredProjects.slice(startIndex, startIndex + 5);
  }, [filteredProjects, safePage]);

  // -----------------------------
  //  Reset Filters
  // -----------------------------

  const resetFilters = () => {
    setSearch("");
    setPriorityFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // -----------------------------
  //  View Project
  // -----------------------------

  // -----------------------------
  //  Popup modal helpers (create / edit / view / dependency)
  // -----------------------------

  const openView = (project) => {
    setSelectedProject(project);
  };

  // -----------------------------
  //  Add / Update Project
  // -----------------------------

  const handleStatusUpdate = async () => {
    if (!statusUpdateProject) return;
    setUpdatingStatus(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const projectId = statusUpdateProject.projectId ?? statusUpdateProject.id;

      const response = await fetch(
        `${API_BASE_URL}/api/v1/projects/${projectId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to update status");
      }

      await fetchProjects({ silent: true });
      setStatusUpdateProject(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }; // ═══════════════════════════════════════════════════════════════════
  //  LIST VIEW: projects table
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        Loading Projects...
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-0">
      {/* Fetch error banner (initial load failures) */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl
            bg-linear-to-br from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-300/40"
          >
            <FaProjectDiagram size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#16244c]">
              Projects
            </h1>
            <p className="text-sm text-[#16244c]/60">
              Manage your Project Portfolio
            </p>
          </div>
          {!loading && (
            <span className="ml-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
              {filteredProjects.length} total
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input w-full rounded-xl py-3 pl-12 text-slate-300 border"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="glass-input rounded-xl p-3 text-slate-800 cursor-pointer border"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="glass-input rounded-xl p-3 text-slate-500 cursor-pointer border"
          >
            <option value="">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <button
            onClick={resetFilters}
            className="glass rounded-xl font-semibold text-slate-600 hover:text-sky-700 hover:-translate-y-0.5 transition cursor-pointer border"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
        <table className="w-full text-sm">
          <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
            <tr>
              <th className="px-4 py-3">Project Name</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">Target Date</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProjects.map((project) => {
              const id = project.projectId ?? project.id;
              const progress = Number(project.projectProgress ?? 0);
              const currStatus = normalizeStatus(project.status);

              return (
                <tr
                  key={id}
                  className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">
                      {project.projectName}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500">
                    {project.startDate ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {project.targetDate ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
              ${
                normalizePriority(project.priority) === "HIGH"
                  ? "bg-red-100 text-red-600"
                  : normalizePriority(project.priority) === "MEDIUM"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          normalizePriority(project.priority) === "HIGH"
                            ? "bg-red-500"
                            : normalizePriority(project.priority) === "MEDIUM"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      {formatPriority(project.priority)}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-semibold text-slate-700">
                    ₹ {Number(project.budget || 0).toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        currStatus === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : currStatus === "IN_PROGRESS"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {currStatus.replace("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="w-28">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>
                          {project.projectProgress != null
                            ? `${progress.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress === 100
                              ? "bg-emerald-500"
                              : "bg-linear-to-r from-sky-500 to-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openView(project)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600
                          hover:bg-sky-100 hover:scale-110 transition-all cursor-pointer"
                        title="View"
                      >
                        <FaEye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusUpdateProject(project);
                          setNewStatus(normalizeStatus(project.status));
                          setError("");
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600
                          hover:bg-indigo-100 hover:scale-110 transition-all cursor-pointer"
                        title="Update Status"
                      >
                        <FaEdit size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProjects.length > 0 && (
        <div className="glass mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="text-sm text-slate-600">
            Showing {Math.min(5, filteredProjects.length)} projects per page
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="glass rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="rounded-lg bg-linear-to-r from-sky-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-sky-300/40">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safePage === totalPages}
              className="glass rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------
          View Project Modal
      ------------------------------ */}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto bg-slate-900/10 p-4 backdrop-blur-xs">
          {/* Soft background glow */}
          <div className="pointer-events-none fixed inset-0">
            <div className="absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/10 blur-3xl" />
          </div>

          {/* ================= GLASS MODAL ================= */}
          <div
            className="
        relative m-auto w-full max-w-3xl
        max-h-[90vh]
        overflow-y-auto
        rounded-3xl

        border border-white/70
        bg-white/75
        shadow-2xl shadow-violet-200/40
        backdrop-blur-2xl

        ring-1 ring-violet-100/50

        lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]
      "
          >
            {/* ================= HEADER ================= */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/70 bg-white/10 px-6 py-5 backdrop-blur-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300">
                  Project Overview
                </span>

                <h2 className="mt-1 text-xl font-bold text-slate-800">
                  Project Details
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Detailed view of the selected project.
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => setSelectedProject(null)}
                className="
            flex h-9 w-9 cursor-pointer
            items-center justify-center
            rounded-full
            border border-white/80
            bg-white/60
            text-slate-400
            shadow-sm
            backdrop-blur-md
            transition-all duration-200
            hover:scale-105
            hover:bg-white
            hover:text-slate-700
            hover:shadow-md
          "
                title="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* ================= CONTENT ================= */}
            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Name */}
                <div
                  className="
                    rounded-2xl
                    border border-white/80
                    bg-white/50
                    p-4
                    shadow-sm
                    backdrop-blur-xl
                    transition-all duration-200
                    hover:bg-white/70
                    hover:shadow-md
                  "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Project Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedProject.activityName ??
                      selectedProject.projectName ??
                      "N/A"}
                  </p>
                </div>

                {/* Project ID */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
              transition-all duration-200
              hover:bg-white/70
              hover:shadow-md
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Project ID
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    #{selectedProject.projectId ?? selectedProject.id ?? "N/A"}
                  </p>
                </div>

                {/* Description */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
              md:col-span-2
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {selectedProject.description || "No description available."}
                  </p>
                </div>

                {/* Start Date */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Start Date
                  </p>

                  <p className="mt-1 text-slate-700">
                    {selectedProject.startDate ?? "N/A"}
                  </p>
                </div>

                {/* Target Date */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Target Date
                  </p>

                  <p className="mt-1 text-slate-700">
                    {selectedProject.targetDate ?? "N/A"}
                  </p>
                </div>

                {/* Priority */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Priority
                  </p>

                  <p className="mt-1 font-medium text-slate-700">
                    {selectedProject.priority ?? "N/A"}
                  </p>
                </div>

                {/* Budget */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Budget
                  </p>

                  <p className="mt-1 font-medium text-slate-700">
                    ₹{" "}
                    {selectedProject.budget ??
                      selectedProject.normalCost ??
                      "N/A"}
                  </p>
                </div>

                {/* Status */}
                <div
                  className="
              rounded-2xl
              border border-white/80
              bg-white/50
              p-4
              shadow-sm
              backdrop-blur-xl
              md:col-span-2
            "
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                    Status
                  </p>

                  <div className="mt-2">
                    <span
                      className="
                      inline-flex items-center gap-2
                      rounded-full
                      border border-emerald-200/60
                      bg-emerald-50/70
                      px-3 py-1.5
                      text-xs font-semibold
                      text-emerald-600
                    "
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      {selectedProject.status ?? "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= FOOTER ================= */}
            <div
              className="
          sticky bottom-0
          flex justify-end
          border-t border-white/70
          bg-white/60
          px-6 py-4
          backdrop-blur-xl
        "
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="
            cursor-pointer
            rounded-xl
            border border-white/80
            bg-white/70
            px-6 py-2
            text-sm font-medium
            text-slate-700
            shadow-sm
            backdrop-blur-md
            transition-all duration-200
            hover:bg-white
            hover:text-violet-600
            hover:shadow-md
          "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------
          Status Update Modal
      ------------------------------ */}
      {statusUpdateProject && (
  <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-xs">
    <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
      
      <div className="flex items-center justify-between bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-white">
        <h2 className="text-lg font-bold">
          Update Project Status
        </h2>

        <button
          onClick={() => setStatusUpdateProject(null)}
          className="cursor-pointer rounded-full p-1.5 transition hover:bg-white/20"
        >
          <FaTimes />
        </button>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
            <FaExclamationTriangle className="shrink-0" />
            {error}
          </div>
        )}

        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          New Status
        </label>

        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full cursor-pointer rounded-lg border border-cyan-200 bg-white p-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        >
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
        <button
          onClick={() => setStatusUpdateProject(null)}
          disabled={updatingStatus}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleStatusUpdate}
          disabled={updatingStatus}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-cyan-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSave />
          {updatingStatus ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="glass mt-10 rounded-3xl py-16 text-center">
          <h2 className="text-2xl font-black text-slate-700">
            No Projects Found
          </h2>
          <p className="mt-2 text-gray-500">
            Try changing your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default Projects;
