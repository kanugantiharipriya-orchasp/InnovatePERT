import { useMemo, useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaProjectDiagram,
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen,
  FaBox,
  FaUserTie,
  FaExchangeAlt,
} from "react-icons/fa";

import ProjectForm from "../Manager/ProjectForm";
import TransferProjectModal from "../../components/TransferProjectModal";
import { projectManagerService } from "../../services/projectManagerService";
import { validateProjectName, validateDescription, validatePositiveNumber } from "../../utils/validation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const EMPTY_PROJECT = {
  projectName: "",
  description: "",
  budget: "",
  priority: "Medium",
  status: "Not Started",
  startDate: "",
  targetDate: "",
};

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

const formatStatus = (value) => {
  switch (normalizeStatus(value)) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    default:
      return "Not Started";
  }
};

const normalizeProjectsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const candidates = [
    data.content,
    data.data,
    data.projects,
    data.items,
    data.result,
    data.projectList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const PRIORITY_STYLES = {
  HIGH: "bg-rose-100 text-rose-600 ring-rose-200/70",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-200/70",
  LOW: "bg-emerald-100 text-emerald-700 ring-emerald-200/70",
};

const STATUS_STYLES = {
  NOT_STARTED: "bg-slate-100 text-slate-600 ring-slate-200/70",
  IN_PROGRESS: "bg-orange-100 text-orange-700 ring-orange-200/70",
  COMPLETED: "bg-emerald-100 text-emerald-700 ring-emerald-200/70",
};

const barColor = (v) =>
  v >= 75
    ? "from-emerald-400 to-teal-500"
    : v >= 50
      ? "from-sky-400 to-blue-500"
      : v >= 25
        ? "from-amber-400 to-orange-500"
        : "from-rose-400 to-red-500";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("ACTIVE");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewModalProject, setViewModalProject] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [originalProject, setOriginalProject] = useState(null);

  const [transferModalProject, setTransferModalProject] = useState(null);
  const [managers, setManagers] = useState([]);
  const [managersLoaded, setManagersLoaded] = useState(false);

  const handleOpenTransferModal = async (project) => {
    setTransferModalProject(project);
    if (!managersLoaded) {
      try {
        const response = await projectManagerService.getAll();
        // Sometimes backend returns raw array, sometimes inside content/data
        let mgrs = Array.isArray(response) ? response : (response.content || response.data || []);
        if (!Array.isArray(mgrs)) mgrs = [];
        setManagers(mgrs.filter(m => m.status === 'ACTIVE'));
        setManagersLoaded(true);
      } catch (err) {
        console.error("Failed to load managers", err);
      }
    }
  };

  useEffect(() => {
    if (formOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [formOpen]);

  const fetchProjects = async (tab = activeTab) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const endpoint = tab === "DELETED" ? "/api/v1/projects/deleted" : "/api/v1/projects";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json().catch(() => null);
      setProjects(normalizeProjectsResponse(data));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const filteredProjects = useMemo(() => {
    let data = [...projects];

    if (search.trim() !== "") {
      const searchText = search.trim().toLowerCase();
      data = data.filter((item) =>
        [item?.projectName, item?.description, item?.pmName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText)
      );
    }

    if (priorityFilter !== "") {
      data = data.filter(
        (item) => normalizePriority(item?.priority) === priorityFilter
      );
    }

    if (statusFilter !== "") {
      data = data.filter(
        (item) => normalizeStatus(item?.status) === statusFilter
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

  const resetFilters = () => {
    setSearch("");
    setPriorityFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value,
    });
    setFieldErrors({
      ...fieldErrors,
      [e.target.name]: "",
    });
  };

  const openAddModal = () => {
    setError("");
    setFieldErrors({});
    setNewProject(EMPTY_PROJECT);
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEditModal = (project) => {
    setError("");
    setFieldErrors({});
    setNewProject({ ...project });
    setOriginalProject({ ...project });
    setEditingProject(project);
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (formOpen) setFormOpen(false);
  };

  const saveProject = async () => {
    if (saving) return;
    
    setFieldErrors({});
    setError("");

    const nameErr = validateProjectName(newProject.projectName);
    if (nameErr) { setFieldErrors((p) => ({ ...p, projectName: nameErr })); return; }
    
    const descErr = validateDescription(newProject.description, true);
    if (descErr) { setFieldErrors((p) => ({ ...p, description: descErr })); return; }
    
    if (newProject.budget) {
      const budgetErr = validatePositiveNumber(newProject.budget);
      if (budgetErr) { setFieldErrors((p) => ({ ...p, budget: budgetErr })); return; }
    }
    
    setSaving(true);

    const token = localStorage.getItem("token");
    const payload = {
      ...newProject,
      budget: Number(newProject.budget) || 0,
      priority: normalizePriority(newProject.priority),
      status: normalizeStatus(newProject.status),
    };

    const editId = editingProject?.projectId ?? editingProject?.id;

    try {
      const url = editId
        ? `${API_BASE_URL}/api/v1/projects/${editId}`
        : `${API_BASE_URL}/api/v1/projects`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        throw new Error(result.message || "Unable to save project");
      }

      const createdProject = result?.data ?? result?.project ?? result;

      if (createdProject && typeof createdProject === "object") {
        setProjects((prevProjects) => {
          const existingId = createdProject.projectId ?? createdProject.id;
          const exists = prevProjects.some(
            (project) => (project.projectId ?? project.id) === existingId,
          );

          if (exists) {
            return prevProjects.map((project) =>
              (project.projectId ?? project.id) === existingId
                ? { ...project, ...createdProject }
                : project,
            );
          }

          return [createdProject, ...prevProjects];
        });
      }

      setEditingProject(null);
      setFormOpen(false);
      await fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to save project");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to delete project");
      }

      await fetchProjects(activeTab);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to delete project");
    }
  };

  const restoreProject = async (id) => {
    if (!window.confirm("Restore this project to Active status?")) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}/restore`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to restore project");
      }

      await fetchProjects(activeTab);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to restore project");
    }
  };

  const permanentlyDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}/permanent`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to permanently delete project");
      }

      await fetchProjects(activeTab);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to permanently delete project");
    }
  };

  // ── Content ────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center rounded-3xl border border-rose-100 bg-rose-50/80 px-6 py-16 text-rose-600">
          {error}
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200">
            <FaProjectDiagram size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Projects <span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">Portfolio</span>
            </h1>
            <p className="text-sm text-slate-500">
              Monitor projects assigned to your team's Project Managers
            </p>
          </div>
          {!loading && (
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 ring-1 ring-sky-100">
              <FaBox className="text-[10px]" />
              {filteredProjects.length} total
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <button
          onClick={() => { setActiveTab("ACTIVE"); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "ACTIVE"
              ? "bg-slate-800 text-white shadow-lg"
              : "bg-white text-slate-500 hover:bg-slate-100"
          }`}
        >
          Active Projects
        </button>
        <button
          onClick={() => { setActiveTab("DELETED"); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "DELETED"
              ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
              : "bg-white text-slate-500 hover:bg-slate-100"
          }`}
        >
          Deleted Projects
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-3xl p-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search project or manager..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cursor-pointer rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
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
            className="cursor-pointer rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <button
            onClick={resetFilters}
            className="cursor-pointer rounded-xl bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:text-sky-700"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/85 p-14 text-center shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-sky-100 to-blue-100 text-cyan-500 shadow-inner">
            <FaFolderOpen size={30} />
          </div>
          <h4 className="text-xl font-black text-slate-800">No Projects Found</h4>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            There are no projects matching your filters. Try adjusting the
            search or clearing the filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
          <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
                <tr className="text-left">
<th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {paginatedProjects.map((project) => {
                  const projId = project.projectId ?? project.id;
                  const prio = normalizePriority(project.priority);
                  const stat = normalizeStatus(project.status);
                  return (
                    <tr
                      key={projId}
                      className="transition-colors duration-200 hover:bg-[#f0f9ff]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-100 to-blue-200 text-xs font-black text-sky-700">
                            {(project.projectName || "P").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-800">
                            {project.projectName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <FaUserTie className="text-slate-300" />
                          <span className="font-semibold">
                            {project.pmName || "Unassigned"}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            PRIORITY_STYLES[prio] || PRIORITY_STYLES.MEDIUM
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              prio === "HIGH"
                                ? "bg-rose-500"
                                : prio === "LOW"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          {formatPriority(project.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            STATUS_STYLES[stat] || STATUS_STYLES.NOT_STARTED
                          }`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            {stat === "IN_PROGRESS" && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                            )}
                            <span
                              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                                stat === "ASSIGNED"
                                  ? "bg-blue-500"
                                  : stat === "COMPLETED"
                                    ? "bg-emerald-500"
                                    : stat === "IN_PROGRESS"
                                      ? "bg-orange-500"
                                      : "bg-slate-400"
                              }`}
                            />
                          </span>
                          {formatStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className={`h-full rounded-full bg-linear-to-r ${barColor(Number(project.projectProgress) || 0)} transition-all duration-700`}
                              style={{ width: `${Math.min(Number(project.projectProgress) || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {project.projectProgress != null
                              ? `${project.projectProgress}%`
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          {activeTab === "ACTIVE" ? (
                            <>
                              <button
                                onClick={() => setViewModalProject(project)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-md cursor-pointer"
                                title="View Details"
                              >
                                <FaEye size={12} />
                              </button>
                              {project.status === 'NOT_STARTED' && (
                                <button
                                  onClick={() => openEditModal(project)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-md cursor-pointer"
                                  title="Edit"
                                >
                                  <FaEdit size={12} />
                                </button>
                              )}
                              {project.assignedToId && (
                                <button
                                  onClick={() => handleOpenTransferModal(project)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-100 hover:shadow-md cursor-pointer"
                                  title="Transfer Project"
                                >
                                  <FaExchangeAlt size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteProject(projId)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 ring-1 ring-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md cursor-pointer"
                                title="Delete"
                              >
                                <FaTrash size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => restoreProject(projId)}
                                className="flex px-3 py-1.5 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md cursor-pointer"
                                title="Restore"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => permanentlyDeleteProject(projId)}
                                className="flex px-3 py-1.5 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-100 font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md cursor-pointer"
                                title="Permanently Delete"
                              >
                                Permanently Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100/80 bg-white/60 px-6 py-4 sm:flex-row">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-black text-slate-800">
                {(safePage - 1) * 5 + 1}
              </span>{" "}
              –{" "}
              <span className="font-black text-slate-800">
                {Math.min(safePage * 5, filteredProjects.length)}
              </span>{" "}
              of{" "}
              <span className="font-black text-sky-600">
                {filteredProjects.length}
              </span>{" "}
              projects
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                title="Previous page"
              >
                <FaChevronLeft size={12} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-8 w-8 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    safePage === i + 1
                      ? "bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                title="Next page"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {viewModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/18 backdrop-blur-[6px]">
          <div className="w-full max-w-lg overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <FaProjectDiagram size={16} />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {viewModalProject.projectName}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      #{viewModalProject.projectId ?? viewModalProject.id ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewModalProject(null)}
                  className="cursor-pointer rounded-full bg-slate-100 p-1.5 text-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="space-y-3 p-6 text-sm text-slate-600">
              <div>
                <strong className="text-slate-700">Description</strong>
                <p className="mt-1 rounded-xl bg-slate-50 p-3">
                  {viewModalProject.description || "No description provided."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Priority</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {formatPriority(viewModalProject.priority)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Status</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {formatStatus(viewModalProject.status)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Budget</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    ${Number(viewModalProject.budget || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Assigned PM</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {viewModalProject.pmName || "Unassigned"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Start Date</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {viewModalProject.startDate || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-400">Target Date</p>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {viewModalProject.targetDate || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200/60 px-6 py-4">
              <button
                onClick={() => setViewModalProject(null)}
                className="cursor-pointer rounded-xl bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] px-6 py-2 font-semibold text-slate-700 transition hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}      {/* ── New / Edit Project Modal ── */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/18 backdrop-blur-[6px]"
          onClick={closeFormModal}
        >
          <div className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectForm
              formData={newProject}
              isEditing={!!editingProject}
              error={error}
              fieldErrors={fieldErrors}
              saving={saving}
              disabled={!!editingProject && originalProject && JSON.stringify(newProject) === JSON.stringify(originalProject)}
              onChange={handleChange}
              onSave={saveProject}
              onCancel={closeFormModal}
              hideStatus={true}
            />
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="relative bg-white flex min-h-screen">
      <AdminSidebar open={open} setOpen={setOpen} />
      <main className={`relative z-10 flex-1 transition-all duration-300 p-6 lg:p-8 overflow-x-hidden ${open ? "ml-64" : "ml-20"}`}>
        {renderContent()}
      </main>
      {/* Modal - Transfer Project */}
      <TransferProjectModal
        isOpen={!!transferModalProject}
        onClose={() => setTransferModalProject(null)}
        project={transferModalProject}
        managers={managers}
        onSuccess={() => {
          fetchProjects(activeTab);
        }}
      />
    </div>
  );
}

export default Projects;
