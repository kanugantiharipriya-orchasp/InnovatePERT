import { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaTasks,
  FaRupeeSign,
  FaWallet,
  FaPiggyBank,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaInfoCircle,
  FaLink,
} from "react-icons/fa";
import ManagerDependencies from "./ManagerDependencies";
import { handleTextInput, handleNumberInput, blockInvalidNumberKeys } from "../../utils/validation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

// Handles every common Spring Boot response shape
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of [
    "content",
    "data",
    "items",
    "result",
    "activities",
    "projectList",
    "list",
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

const statusConfig = {
  COMPLETED: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-blue-100 text-blue-700 ring-1 ring-blue-200" },
  NOT_STARTED: { label: "Not Started", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
};

const getStatus = (raw) => {
  const key = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  return (
    statusConfig[key] ?? { label: raw ?? "—", cls: "bg-slate-100 text-slate-500" }
  );
};

const EMPTY_FORM = {
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
  dependencyActivityId: "",
  predecessorActivityId: "",
};

function ManagerActivities() {
  const [selectedProject, setSelectedProject] = useState("");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Budget Summary State
  const [budgetSummary, setBudgetSummary] = useState({
    projectBudget: 0,
    allocatedBudget: 0,
    remainingBudget: 0,
  });
  const [loadingBudget, setLoadingBudget] = useState(false);

  // edit modal
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(EMPTY_FORM);
  const [originalEditData, setOriginalEditData] = useState(null);
  const [originalNormalCost, setOriginalNormalCost] = useState(0);
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  // status patch loading
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depActivity, setDepActivity] = useState(null);

  // delete
  const [deletingId, setDeletingId] = useState(null);

  // inline form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Lock body scroll while any modal is open
  useEffect(() => {
    if (showForm || editModal || viewModal || depModalOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showForm, editModal, viewModal, depModalOpen]);

  const getToken = () => localStorage.getItem("token");

  // ── fetch projects — auto-select the first one ───────────────────────────
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
        setSelectedProject(String(list[0].projectId));
      }
    } catch (e) {
      console.error("fetchProjects:", e);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // ── fetch budget summary ──────────────────────────────────────────────────
  const fetchBudgetSummary = useCallback(async () => {
    if (!selectedProject) {
      setBudgetSummary({ projectBudget: 0, allocatedBudget: 0, remainingBudget: 0 });
      return;
    }
    setLoadingBudget(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/projects/${selectedProject}/budget-summary`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setBudgetSummary({
          projectBudget: data.projectBudget || 0,
          allocatedBudget: data.allocatedBudget || 0,
          remainingBudget: data.remainingBudget || 0,
        });
      }
    } catch (e) {
      console.error("fetchBudgetSummary:", e);
    } finally {
      setLoadingBudget(false);
    }
  }, [selectedProject]);

  // ── fetch activities ──────────────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const base = selectedProject
        ? `${API_BASE_URL}/api/v1/activities/project/${selectedProject}`
        : `${API_BASE_URL}/api/v1/activities`;

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      const url = `${base}${params.toString() ? "?" + params : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        console.error("[Activities] fetch failed:", res.status);
        setActivities([]);
        return;
      }

      const raw = await res.json();
      setActivities(normalizeList(raw));
    } catch (e) {
      console.error("fetchActivities:", e);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [selectedProject, search]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchActivities();
      fetchBudgetSummary();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchActivities, fetchBudgetSummary]);

  // ── PERT auto-calc ────────────────────────────────────────────────────────
  // ── PERT auto-calc for Create Form ──────────────────────────────────────────
  useEffect(() => {
    const oRaw = formData.optimisticTime;
    const mRaw = formData.mostLikelyTime;
    const pRaw = formData.pessimisticTime;
    if (oRaw !== "" && mRaw !== "" && pRaw !== "") {
      const o = parseFloat(oRaw);
      const m = parseFloat(mRaw);
      const p = parseFloat(pRaw);
      if (o < m && m < p && o >= 0 && m >= 0 && p >= 0) {
        setFormData((prev) => ({
          ...prev,
          expectedTime: ((o + 4 * m + p) / 6).toFixed(2),
        }));
      } else {
        setFormData((prev) => ({ ...prev, expectedTime: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, expectedTime: "" }));
    }
  }, [formData.optimisticTime, formData.mostLikelyTime, formData.pessimisticTime]);

  // ── PERT auto-calc for Edit Form ────────────────────────────────────────────
  useEffect(() => {
    const oRaw = editData.optimisticTime;
    const mRaw = editData.mostLikelyTime;
    const pRaw = editData.pessimisticTime;
    if (oRaw !== "" && mRaw !== "" && pRaw !== "") {
      const o = parseFloat(oRaw);
      const m = parseFloat(mRaw);
      const p = parseFloat(pRaw);
      if (o < m && m < p && o >= 0 && m >= 0 && p >= 0) {
        setEditData((prev) => ({
          ...prev,
          expectedTime: ((o + 4 * m + p) / 6).toFixed(2),
        }));
      } else {
        setEditData((prev) => ({ ...prev, expectedTime: "" }));
      }
    } else {
      setEditData((prev) => ({ ...prev, expectedTime: "" }));
    }
  }, [editData.optimisticTime, editData.mostLikelyTime, editData.pessimisticTime]);

  // ── form helpers & real-time budget check ─────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    if (formFieldErrors[name]) {
      setFormFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setFormFieldErrors({});
    setShowForm(false);
  };

  // Check budget over-allocation for new activity
  const newNormalCost = parseFloat(formData.normalCost) || 0;
  const isNewBudgetExceeded = newNormalCost > budgetSummary.remainingBudget;

  // Check budget change for edit
  const editNormalCost = parseFloat(editData.normalCost) || 0;
  const costDifference = editNormalCost - originalNormalCost;
  const isEditBudgetExceeded = costDifference > budgetSummary.remainingBudget;

  const hasEditChanges = originalEditData && (
    editData.activityName !== originalEditData.activityName ||
    editData.optimisticTime !== originalEditData.optimisticTime ||
    editData.mostLikelyTime !== originalEditData.mostLikelyTime ||
    editData.pessimisticTime !== originalEditData.pessimisticTime ||
    editData.crashTime !== originalEditData.crashTime ||
    editData.normalCost !== originalEditData.normalCost ||
    editData.crashCost !== originalEditData.crashCost ||
    editData.predecessorActivityId !== originalEditData.predecessorActivityId
  );

  // Comprehensive Activity Form Validation (used by both Create and Edit)
  const validateActivityInputs = (data, isEdit = false, currentActId = null) => {
    if (!data.activityName || !data.activityName.trim()) return "Activity Name is required.";
    if (!data.projectId) return "Project is required.";
    if (!data.optimisticTime) return "Optimistic Time is required.";
    if (!data.mostLikelyTime) return "Most Likely Time is required.";
    if (!data.pessimisticTime) return "Pessimistic Time is required.";
    if (!data.normalCost) return "Normal Cost is required.";

    const o = parseFloat(data.optimisticTime);
    const m = parseFloat(data.mostLikelyTime);
    const p = parseFloat(data.pessimisticTime);
    if (isNaN(o) || isNaN(m) || isNaN(p) || o < 0 || m < 0 || p < 0) {
      return "Time estimates cannot be negative.";
    }
    if (!(o < m && m < p)) {
      return "PERT values must satisfy: Optimistic Time < Most Likely Time < Pessimistic Time.";
    }

    const expectedTime = parseFloat(((o + 4 * m + p) / 6).toFixed(2));

    // Crash Time & Crash Cost Validation
    const hasCrashTime = data.crashTime !== "" && data.crashTime !== null && data.crashTime !== undefined;
    const hasCrashCost = data.crashCost !== "" && data.crashCost !== null && data.crashCost !== undefined;

    if (hasCrashTime) {
      const ct = parseFloat(data.crashTime);
      if (isNaN(ct)) return "Crash Time must be a valid number.";
      if (ct >= expectedTime) {
        return `Crash Time must be less than the calculated Expected Time (${expectedTime} days).`;
      }
      if (!hasCrashCost) {
        return "Crash Cost is mandatory when Crash Time is provided.";
      }
      const cc = parseFloat(data.crashCost);
      const nc = parseFloat(data.normalCost);
      if (isNaN(cc) || cc <= nc) {
        return "Crash Cost must be greater than Normal Cost.";
      }
    } else {
      if (hasCrashCost) {
        return "Crash Cost cannot be provided without Crash Time.";
      }
    }

    // Budget check
    if (!isEdit && isNewBudgetExceeded) {
      return `Budget exceeded. Remaining Budget: ₹${budgetSummary.remainingBudget.toLocaleString()}`;
    }
    if (isEdit && isEditBudgetExceeded) {
      return `Budget exceeded. Remaining Budget: ₹${budgetSummary.remainingBudget.toLocaleString()}`;
    }

    // Project Business Target Duration Validation
    const currentProj = projects.find((proj) => String(proj.projectId) === String(data.projectId));
    if (currentProj && currentProj.startDate && currentProj.targetDate) {
      const start = new Date(currentProj.startDate);
      const target = new Date(currentProj.targetDate);
      const diffTime = target - start;
      const targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (targetDays > 0) {
        const existingSum = activities
          .filter((a) => String(a.projectId) === String(data.projectId) && (currentActId == null || String(a.activityId ?? a.id) !== String(currentActId)))
          .reduce((sum, a) => {
            const exp = a.expectedTime != null ? parseFloat(a.expectedTime) : (parseFloat(a.optimisticTime ?? 0) + 4 * parseFloat(a.mostLikelyTime ?? 0) + parseFloat(a.pessimisticTime ?? 0)) / 6;
            return sum + (isNaN(exp) ? 0 : exp);
          }, 0);
        const totalExpectedProjectDuration = existingSum + expectedTime;
        if (totalExpectedProjectDuration > targetDays) {
          return `Expected project duration (${totalExpectedProjectDuration.toFixed(2)} days) exceeds the business target duration (${targetDays} days). Please adjust the activity estimates.`;
        }
      }
    }

    return null;
  };

  const validateForm = () => validateActivityInputs(formData, false, null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrs = {};
    if (!formData.activityName.trim()) fieldErrs.activityName = "Activity Name is required.";
    if (!formData.optimisticTime) fieldErrs.optimisticTime = "Optimistic Time is required.";
    if (!formData.mostLikelyTime) fieldErrs.mostLikelyTime = "Most Likely Time is required.";
    if (!formData.pessimisticTime) fieldErrs.pessimisticTime = "Pessimistic Time is required.";
    if (!formData.normalCost) fieldErrs.normalCost = "Normal Cost is required.";
    if (formData.crashTime && !formData.crashCost) fieldErrs.crashCost = "Crash Cost is required when Crash Time is provided.";
    if (Object.keys(fieldErrs).length > 0) {
      setFormFieldErrors(fieldErrs);
      setFormError("");
      return;
    }
    setFormFieldErrors({});
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        activityName: formData.activityName,
        projectId: parseInt(formData.projectId || selectedProject, 10),
        optimisticTime: parseFloat(formData.optimisticTime),
        mostLikelyTime: parseFloat(formData.mostLikelyTime),
        pessimisticTime: parseFloat(formData.pessimisticTime),
        normalCost: parseFloat(formData.normalCost),
        dependencyType: formData.dependencyType,
        predecessorActivityId: formData.dependencyType === "HAS_DEPENDENCY"
          ? (formData.predecessorActivityId ? parseInt(formData.predecessorActivityId, 10) : (formData.dependencyActivityId ? parseInt(formData.dependencyActivityId, 10) : null))
          : null,
      };

      if (formData.crashTime !== "" && formData.crashTime !== null && formData.crashTime !== undefined) {
        payload.crashTime = parseFloat(formData.crashTime);
        payload.crashCost = parseFloat(formData.crashCost);
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/activities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Failed (${res.status})`;
        try {
          const d = await res.json();
          if (d.fieldErrors) {
            const errs = Object.entries(d.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(", ");
            msg = `${d.message || "Validation Error"} - ${errs}`;
          } else {
            msg = typeof d === "string" ? d : d.message || msg;
          }
        } catch {
          /* ignore */
        }
        setFormError(msg);
        return;
      }
      resetForm();
      await Promise.all([fetchActivities(), fetchBudgetSummary()]);
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── open edit modal pre-filled ────────────────────────────────────────────
  const openEdit = (a) => {
    if (a.status === "COMPLETED") {
      alert("Completed activities cannot be edited.");
      return;
    }
    const costNum = parseFloat(a.normalCost ?? 0);
    setOriginalNormalCost(costNum);
    const o = parseFloat(a.optimisticTime ?? 0);
    const m = parseFloat(a.mostLikelyTime ?? 0);
    const p = parseFloat(a.pessimisticTime ?? 0);
    const expCalc = o > 0 && m > 0 && p > 0 ? ((o + 4 * m + p) / 6).toFixed(2) : "";

    const snapshot = {
      activityId: a.activityId ?? a.id,
      activityName: a.activityName ?? "",
      projectId: String(a.projectId ?? selectedProject ?? ""),
      optimisticTime: String(a.optimisticTime ?? ""),
      mostLikelyTime: String(a.mostLikelyTime ?? ""),
      pessimisticTime: String(a.pessimisticTime ?? ""),
      expectedTime: String(a.expectedTime ?? expCalc),
      crashTime: String(a.crashTime ?? ""),
      normalCost: String(a.normalCost ?? ""),
      crashCost: String(a.crashCost ?? ""),
      dependencyType: a.dependencyType ?? "NO_DEPENDENCY",
      dependencyActivityId: String(a.dependencyActivityId ?? ""),
      predecessorActivityId: String(a.predecessorActivityId ?? a.dependencyActivityId ?? ""),
    };
    setEditData(snapshot);
    setOriginalEditData({ ...snapshot });
    setEditError("");
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setEditError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const err = validateActivityInputs(editData, true, editData.activityId);
    if (err) {
      setEditError(err);
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        activityName: editData.activityName,
        projectId: parseInt(editData.projectId || selectedProject, 10),
        optimisticTime: parseFloat(editData.optimisticTime),
        mostLikelyTime: parseFloat(editData.mostLikelyTime),
        pessimisticTime: parseFloat(editData.pessimisticTime),
        normalCost: parseFloat(editData.normalCost),
        dependencyType: editData.dependencyType,
        predecessorActivityId: editData.dependencyType === "HAS_DEPENDENCY"
          ? (editData.predecessorActivityId ? parseInt(editData.predecessorActivityId, 10) : (editData.dependencyActivityId ? parseInt(editData.dependencyActivityId, 10) : null))
          : null,
      };

      if (editData.crashTime !== "" && editData.crashTime !== null && editData.crashTime !== undefined) {
        payload.crashTime = parseFloat(editData.crashTime);
        payload.crashCost = parseFloat(editData.crashCost);
      }

      const res = await fetch(
        `${API_BASE_URL}/api/v1/activities/${editData.activityId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let msg = `Update failed (${res.status})`;
        try {
          const d = await res.json();
          if (d.fieldErrors) {
            const errs = Object.entries(d.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(", ");
            msg = `${d.message || "Validation Error"} - ${errs}`;
          } else {
            msg = typeof d === "string" ? d : d.message || msg;
          }
        } catch {
          /* ignore */
        }
        setEditError(msg);
        return;
      }
      setEditModal(false);
      await Promise.all([fetchActivities(), fetchBudgetSummary()]);
    } catch {
      setEditError("An error occurred. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // ── Status Patch Handler ──────────────────────────────────────────────────
  const handleStatusChange = async (activityId, newStatus) => {
    setUpdatingStatusId(activityId);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/activities/${activityId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        let errorMsg = "Failed to update status";
        try {
          const data = await res.json();
          errorMsg = typeof data === "string" ? data : data.message || errorMsg;
        } catch {
          /* fallback */
        }
        alert(errorMsg);
        return;
      }

      await Promise.all([fetchActivities(), fetchBudgetSummary()]);
    } catch (err) {
      console.error("Error updating activity status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (activityId) => {
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;
    setDeletingId(activityId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/activities/${activityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        await Promise.all([fetchActivities(), fetchBudgetSummary()]);
      } else {
        let msg = "Delete failed";
        try {
          const data = await res.json();
          msg = typeof data === "string" ? data : data.message || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      }
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const displayed = activities.filter((a) => {
    if (!search.trim()) return true;
    return (a.activityName ?? "").toLowerCase().includes(search.trim().toLowerCase());
  });

  const getPertInlineErrors = (data) => {
    const errs = {};
    const oRaw = data.optimisticTime;
    const mRaw = data.mostLikelyTime;
    const pRaw = data.pessimisticTime;

    if (oRaw !== "" && mRaw !== "") {
      if (parseFloat(mRaw) <= parseFloat(oRaw)) {
        errs.mostLikelyTime = "Most Likely Time must be strictly greater than Optimistic Time.";
      }
    }
    if (mRaw !== "" && pRaw !== "") {
      if (parseFloat(pRaw) <= parseFloat(mRaw)) {
        errs.pessimisticTime = "Pessimistic Time must be strictly greater than Most Likely Time.";
      }
    } else if (oRaw !== "" && pRaw !== "") {
      if (parseFloat(pRaw) <= parseFloat(oRaw)) {
        errs.pessimisticTime = "Pessimistic Time must be strictly greater than Optimistic Time.";
      }
    }
    return errs;
  };

  const createPertErrors = showForm ? getPertInlineErrors(formData) : {};
  const editPertErrors = editModal ? getPertInlineErrors(editData) : {};

  return (
    <div className="min-h-screen p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-200">
            <FaTasks size={19} />
          </div> */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Activities & Budget Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage project activities, PERT schedules, and allocated budgets
            </p>
          </div>
          {!loadingActivities && (
            <span className="ml-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
              {displayed.length} total
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setFormError("");
            if (!formData.projectId && selectedProject) {
              setFormData((prev) => ({ ...prev, projectId: selectedProject }));
            }
            setShowForm(true);
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <FaPlus size={11} />
          New Activity
        </button>
      </div>

      {/* ═══════════ BUDGET SUMMARY CARDS ═══════════ */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1: Project Budget */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200/90 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Project Budget
              </p>
              <h3 className="mt-1.5 text-xl font-black text-slate-900">
                ₹{budgetSummary.projectBudget.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600 shadow-inner ring-1 ring-blue-100">
              <FaWallet />
            </div>
          </div>
        </div>

        {/* Card 2: Allocated Budget */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200/90 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Allocated Budget
              </p>
              <h3 className="mt-1.5 text-xl font-black text-indigo-600">
                ₹{budgetSummary.allocatedBudget.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600 shadow-inner ring-1 ring-indigo-100">
              <FaChartPie />
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200/90 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Remaining Budget
              </p>
              <h3
                className={`mt-1.5 text-2xl font-black ${
                  budgetSummary.remainingBudget < 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                ₹{budgetSummary.remainingBudget.toLocaleString()}
              </h3>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ring-1 ${
                budgetSummary.remainingBudget < 0
                  ? "bg-rose-50 text-rose-600 ring-rose-100"
                  : "bg-emerald-50 text-emerald-600 ring-emerald-100"
              } text-xl`}
            >
              <FaPiggyBank />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ PROJECT TARGET DURATION & EXPECTED DURATION BANNER ═══════════ */}
      {(() => {
        const currProj = projects.find((p) => String(p.projectId) === String(selectedProject));
        if (!currProj || !currProj.startDate || !currProj.targetDate) return null;
        const start = new Date(currProj.startDate);
        const target = new Date(currProj.targetDate);
        const targetDays = Math.ceil((target - start) / (1000 * 60 * 60 * 24));
        if (targetDays <= 0) return null;

        const projActivities = activities.filter((a) => String(a.projectId) === String(currProj.projectId));
        const totalExpected = projActivities.reduce((sum, a) => {
          const o = parseFloat(a.optimisticTime ?? 0);
          const m = parseFloat(a.mostLikelyTime ?? 0);
          const p = parseFloat(a.pessimisticTime ?? 0);
          const exp = a.expectedTime != null ? parseFloat(a.expectedTime) : (o > 0 && m > 0 && p > 0 ? (o + 4 * m + p) / 6 : 0);
          return sum + (isNaN(exp) ? 0 : exp);
        }, 0);

        const diff = targetDays - totalExpected;
        const isExceeded = totalExpected > targetDays;

        return (
          <div className="mb-6 rounded-3xl p-5 shadow-xs bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <FaClock className="text-blue-500 h-4 w-4" />
                <span className="text-slate-500">Business Target Duration:</span>
                <span className="font-bold text-slate-800 text-sm">{targetDays} days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Expected Project Duration:</span>
                <span className="font-bold text-blue-600 text-sm">{totalExpected.toFixed(2)} days</span>
              </div>
              <div className="flex items-center gap-2">
                {isExceeded ? (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                    Exceeded By: {Math.abs(diff).toFixed(2)} days
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Remaining Buffer: {diff.toFixed(2)} days
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Parent Project Workflow Status Banner */}
      {(() => {
        const currentProj = projects.find((p) => String(p.projectId) === String(selectedProject));
        const statusStr = currentProj ? String(currentProj.status || "").toUpperCase() : "";
        if (!statusStr || statusStr === "IN_PROGRESS") return null;

        return (
          <div className="mb-6 flex items-center gap-3.5 rounded-3xl bg-gray-50 p-4 text-xs shadow-xs">
            <FaInfoCircle className="h-5 w-5 text-sky-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">
                Parent Project Status: {currentProj?.projectName} ({statusStr})
              </span>
              <p className="text-slate-500">
                Activities can only be marked as <strong className="text-blue-600">IN_PROGRESS</strong> after the parent project status is changed to IN_PROGRESS.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── New Activity Modal (light blurred popup) ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end  p-35 bg-slate-700/18 backdrop-blur-[2px]"
          onClick={resetForm}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">New Activity</h2>
                  <p className="text-xs text-slate-500">
                    Fill in the PERT details and normal cost to allocate from remaining budget.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      <FaPiggyBank className="text-slate-500" />
                      <span>Left Budget: ₹{budgetSummary.remainingBudget.toLocaleString()}</span>
                    </div>
                    {(() => {
                      const currProj = projects.find((p) => String(p.projectId) === String(formData.projectId || selectedProject));
                      if (!currProj || !currProj.startDate || !currProj.targetDate) return null;
                      const start = new Date(currProj.startDate);
                      const target = new Date(currProj.targetDate);
                      const targetDays = Math.ceil((target - start) / (1000 * 60 * 60 * 24));
                      if (targetDays <= 0) return null;

                      const projActivities = activities.filter((a) => String(a.projectId) === String(currProj.projectId));
                      const totalExpected = projActivities.reduce((sum, a) => {
                        const o = parseFloat(a.optimisticTime ?? 0);
                        const m = parseFloat(a.mostLikelyTime ?? 0);
                        const p = parseFloat(a.pessimisticTime ?? 0);
                        const exp = a.expectedTime != null ? parseFloat(a.expectedTime) : (o > 0 && m > 0 && p > 0 ? (o + 4 * m + p) / 6 : 0);
                        return sum + (isNaN(exp) ? 0 : exp);
                      }, 0);
                      const diff = targetDays - totalExpected;
                      return (
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          <FaClock className="text-slate-500" />
                          <span>Left Days: {diff.toFixed(2)} days</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-400 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {isNewBudgetExceeded && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-bold text-amber-800">
                <FaExclamationTriangle className="text-amber-600" />
                <span>
                  Budget exceeded. Remaining Budget: ₹
                  {budgetSummary.remainingBudget.toLocaleString()}
                </span>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="activityName"
                  value={formData.activityName}
                  onInput={handleTextInput}
                  onChange={handleFormChange}
                  placeholder="e.g. Requirement Analysis"
                  disabled={saving}
                  className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${formFieldErrors.activityName ? 'border-red-300' : ''}`}
                />
                {formFieldErrors.activityName && <p className="mt-1 text-xs text-red-500">{formFieldErrors.activityName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleFormChange}
                  disabled={saving || loadingProjects}
                  className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
              {[
                { name: "optimisticTime", label: "Optimistic Time (days)" },
                { name: "mostLikelyTime", label: "Most Likely Time (days)" },
                { name: "pessimisticTime", label: "Pessimistic Time (days)" },
              ].map(({ name, label }) => {
                const errorText = formFieldErrors[name] || createPertErrors[name];
                return (
                <div key={name}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name={name}
                    value={formData[name]}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={saving}
                    className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${errorText ? 'border-red-300' : ''}`}
                  />
                  {errorText && <p className="mt-1 text-xs text-red-500">{errorText}</p>}
                </div>
              )})}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Expected Time (auto-calculated)
                </label>
                <input
                  type="number"
                  value={formData.expectedTime}
                  placeholder="—"
                  disabled
                  className="w-full rounded-lg border border-slate-200/60 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-400 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">(O + 4M + P) ÷ 6</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Crash Time (days)
                </label>
                <input
                  type="number"
                  name="crashTime"
                  value={formData.crashTime}
                  onInput={handleNumberInput}
                  onKeyDown={blockInvalidNumberKeys}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={saving}
                  className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Normal Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="normalCost"
                  value={formData.normalCost}
                  onInput={handleNumberInput}
                  onKeyDown={blockInvalidNumberKeys}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={saving}
                  className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${
                    isNewBudgetExceeded || formFieldErrors.normalCost ? "border-red-300" : ""
                  }`}
                />
                {formFieldErrors.normalCost && <p className="mt-1 text-xs text-red-500">{formFieldErrors.normalCost}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Crash Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="crashCost"
                  value={formData.crashCost}
                  onInput={handleNumberInput}
                  onKeyDown={blockInvalidNumberKeys}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={saving}
                  className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${formFieldErrors.crashCost ? 'border-red-300' : ''}`}
                />
                {formFieldErrors.crashCost && <p className="mt-1 text-xs text-red-500">{formFieldErrors.crashCost}</p>}
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Dependency Type
                </label>
                <div className="flex gap-5">
                  {[
                    ["NO_DEPENDENCY", "No Dependency"],
                    ["HAS_DEPENDENCY", "Has Dependency"],
                  ].map(([val, lbl]) => (
                    <label
                      key={val}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                    >
                      <input
                        type="radio"
                        name="dependencyType"
                        value={val}
                        disabled={saving}
                        checked={formData.dependencyType === val}
                        onChange={handleFormChange}
                        className="accent-blue-600 cursor-pointer"
                      />
                      {lbl}
                    </label>
                  ))}
                </div>
                {/* Predecessor Activity Selector */}
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Predecessor Activity (Optional - Must finish before this activity can start)
                  </label>
                  <select
                    name="predecessorActivityId"
                    value={formData.predecessorActivityId || formData.dependencyActivityId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        predecessorActivityId: val,
                        dependencyActivityId: val,
                        dependencyType: val ? "HAS_DEPENDENCY" : "NO_DEPENDENCY",
                      }));
                    }}
                    disabled={saving}
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 cursor-pointer"
                  >
                    <option value="">No Predecessor (Can start immediately)</option>
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
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100/70 pt-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || isNewBudgetExceeded}
                className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Activity"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* ── Filters: project dropdown + search ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        {/* Project dropdown */}
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={loadingProjects}
            className="w-full cursor-pointer appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-4 pr-10 text-sm font-medium text-slate-700 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 sm:w-64"
          >
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName}
              </option>
            ))}
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

        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            type="text"
            placeholder="Search Activity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none"
          />
        </div>
      </div>

      {/* ================= Activity Detail Modal ================= */}
      {viewModal && selectedActivity && (() => {
        const o = parseFloat(selectedActivity.optimisticTime ?? 0);
        const m = parseFloat(selectedActivity.mostLikelyTime ?? 0);
        const p = parseFloat(selectedActivity.pessimisticTime ?? 0);
        const expected =
          selectedActivity.expectedTime ??
          (o > 0 && m > 0 && p > 0 ? ((o + 4 * m + p) / 6).toFixed(2) : "—");
        const variance =
          selectedActivity.variance ??
          (o > 0 && p > 0 ? (((p - o) ** 2) / 36).toFixed(2) : "—");
        const stdDev =
          selectedActivity.standardDeviation ??
          (variance !== "—" ? Math.sqrt(parseFloat(variance)).toFixed(2) : "—");
        const status = getStatus(selectedActivity.status);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/18 backdrop-blur-[6px]"
            onClick={() => setViewModal(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Activity Details
                </h2>
                <button
                  onClick={() => setViewModal(false)}
                  className="cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 p-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400">Activity Name:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.activityName ??
                        selectedActivity.name ??
                        "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <p>
                      <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Optimistic Time:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.optimisticTime ?? "—"} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Most Likely Time:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.mostLikelyTime ?? "—"} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Pessimistic Time:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.pessimisticTime ?? "—"} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Expected Time:</span>
                    <p className="font-semibold text-blue-600">
                      {expected} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Variance:</span>
                    <p className="font-semibold text-slate-800">{variance}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Standard Deviation:</span>
                    <p className="font-semibold text-slate-800">{stdDev}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Crash Time:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.crashTime ?? "—"} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Crash Cost:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.crashCost != null
                        ? `₹${Number(selectedActivity.crashCost).toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Normal Cost:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.normalCost != null
                        ? `₹${Number(selectedActivity.normalCost).toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Predecessor:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedActivity.predecessorActivityName || selectedActivity.dependencyActivityName || "None"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-slate-100/70 p-4">
                <button
                  onClick={() => setViewModal(false)}
                  className="cursor-pointer rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= Edit Activity Modal ================= */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end p-45 bg-slate-700/18 backdrop-blur-[3px]"
          onClick={() => setEditModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-100 border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Activity</h2>
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <FaPiggyBank className="text-slate-500" />
                    <span>Left Budget: ₹{budgetSummary.remainingBudget.toLocaleString()}</span>
                  </div>
                  {(() => {
                    const currProj = projects.find((p) => String(p.projectId) === String(editData.projectId || selectedProject));
                    if (!currProj || !currProj.startDate || !currProj.targetDate) return null;
                    const start = new Date(currProj.startDate);
                    const target = new Date(currProj.targetDate);
                    const targetDays = Math.ceil((target - start) / (1000 * 60 * 60 * 24));
                    if (targetDays <= 0) return null;

                    const projActivities = activities.filter((a) => String(a.projectId) === String(currProj.projectId) && String(a.activityId ?? a.id) !== String(editData.activityId));
                    const totalExpected = projActivities.reduce((sum, a) => {
                      const o = parseFloat(a.optimisticTime ?? 0);
                      const m = parseFloat(a.mostLikelyTime ?? 0);
                      const p = parseFloat(a.pessimisticTime ?? 0);
                      const exp = a.expectedTime != null ? parseFloat(a.expectedTime) : (o > 0 && m > 0 && p > 0 ? (o + 4 * m + p) / 6 : 0);
                      return sum + (isNaN(exp) ? 0 : exp);
                    }, 0);
                    const diff = targetDays - totalExpected;
                    return (
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                        <FaClock className="text-slate-500" />
                        <span>Left Days: {diff.toFixed(2)} days</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6">
              {editError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {editError}
                </div>
              )}
              {isEditBudgetExceeded && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                  <FaExclamationTriangle className="text-amber-600" />
                  <span>
                    Budget exceeded. Remaining Budget: ₹
                    {budgetSummary.remainingBudget.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Activity Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    name="activityName"
                    value={editData.activityName}
                    onInput={handleTextInput}
                    onChange={handleEditChange}
                    disabled={updating}
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Project
                  </label>
                  <div className="w-full rounded-lg border border-slate-200/60 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700">
                    {projects.find(
                      (p) => String(p.projectId) === String(editData.projectId)
                    )?.projectName ?? "—"}
                  </div>
                </div>

                {/* Optimistic Time */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Optimistic Time (days)
                  </label>
                  <input
                    type="number"
                    name="optimisticTime"
                    value={editData.optimisticTime}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${editPertErrors.optimisticTime ? 'border-red-300' : ''}`}
                  />
                  {editPertErrors.optimisticTime && <p className="mt-1 text-xs text-red-500">{editPertErrors.optimisticTime}</p>}
                </div>

                {/* Most Likely Time */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Most Likely Time (days)
                  </label>
                  <input
                    type="number"
                    name="mostLikelyTime"
                    value={editData.mostLikelyTime}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${editPertErrors.mostLikelyTime ? 'border-red-300' : ''}`}
                  />
                  {editPertErrors.mostLikelyTime && <p className="mt-1 text-xs text-red-500">{editPertErrors.mostLikelyTime}</p>}
                </div>

                {/* Pessimistic Time */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Pessimistic Time (days)
                  </label>
                  <input
                    type="number"
                    name="pessimisticTime"
                    value={editData.pessimisticTime}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${editPertErrors.pessimisticTime ? 'border-red-300' : ''}`}
                  />
                  {editPertErrors.pessimisticTime && <p className="mt-1 text-xs text-red-500">{editPertErrors.pessimisticTime}</p>}
                </div>

                {/* Expected Time (auto-calculated) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Expected Time (auto-calculated)
                  </label>
                  <input
                    type="number"
                    value={editData.expectedTime || ""}
                    placeholder="—"
                    disabled
                    className="w-full rounded-lg border border-slate-200/60 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-400 outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">(O + 4M + P) ÷ 6</p>
                </div>

                {/* Crash Time */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Crash Time (days)
                  </label>
                  <input
                    type="number"
                    name="crashTime"
                    value={editData.crashTime}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Normal Cost */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Normal Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="normalCost"
                    value={editData.normalCost}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className={`w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60 ${
                      isEditBudgetExceeded ? "border-rose-400 focus:ring-rose-400" : ""
                    }`}
                  />
                </div>

                {/* Crash Cost */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Crash Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="crashCost"
                    value={editData.crashCost}
                    onInput={handleNumberInput}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    disabled={updating}
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Predecessor Activity Selector */}
              <div className="mt-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] p-4">
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Predecessor Activity (Optional)
                </label>
                <select
                  name="predecessorActivityId"
                  value={editData.predecessorActivityId || editData.dependencyActivityId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditData((prev) => ({
                      ...prev,
                      predecessorActivityId: val,
                      dependencyActivityId: val,
                      dependencyType: val ? "HAS_DEPENDENCY" : "NO_DEPENDENCY",
                    }));
                  }}
                  disabled={updating}
                  className="w-full cursor-pointer rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:opacity-60"
                >
                  <option value="">No Predecessor (Can start immediately)</option>
                  {activities
                    .filter((a) => String(a.activityId ?? a.id) !== String(editData.activityId))
                    .map((a) => (
                      <option key={a.activityId ?? a.id} value={a.activityId ?? a.id}>
                        {a.activityName} ({a.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100/70 pt-5">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  disabled={updating}
                  className="cursor-pointer rounded-lg bg-white border border-slate-200/90 shadow-[0_8px_24px_-14px_rgba(2,132,199,0.1),0_1px_3px_-1px_rgba(2,132,199,0.05)] px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || isEditBudgetExceeded || !hasEditChanges}
                  className="cursor-pointer rounded-lg bg-linear-to-r from-blue-500 to-sky-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updating ? "Updating…" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Data Table ── */}
      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
            <tr className="text-left">
              <th className="px-6 py-4">Activity Name</th>
              <th className="px-6 py-4">Predecessor</th>
              <th className="px-6 py-4">Expected Time</th>
              <th className="px-6 py-4">Variance</th>
              <th className="px-6 py-4">Cost</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {loadingActivities ? (
              <tr>
                <td colSpan="6" className="py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span>Loading activities…</span>
                  </div>
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-sm font-semibold text-slate-400">
                  <p className="text-base font-medium">No activities found</p>
                  <p className="mt-1 text-sm">
                    {selectedProject
                      ? "Try a different project or clear the filter."
                      : 'Click "+ New Activity" to get started.'}
                  </p>
                </td>
              </tr>
            ) : (
              displayed.map((a) => {
                const actId = a.activityId ?? a.id;
                const o = parseFloat(a.optimisticTime ?? a.optimistic ?? 0);
                const p = parseFloat(a.pessimisticTime ?? a.pessimistic ?? 0);
                const variance =
                  o > 0 && p > 0
                    ? (((p - o) ** 2) / 36).toFixed(2)
                    : a.variance ?? "—";

                const cost = a.normalCost ?? a.cost ?? a.crashCost;
                const currStatus = String(a.status ?? "NOT_STARTED")
                  .toUpperCase()
                  .replace(/\s+/g, "_");

                const isCompleted = currStatus === "COMPLETED";
                const isUpdatingThisStatus = updatingStatusId === actId;

                return (
                  <tr key={actId} className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {a.activityName ?? a.name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {a.predecessorActivityName ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          <FaLink size={10} /> {a.predecessorActivityName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {a.expectedTime != null ? `${Math.round(a.expectedTime)} days` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{variance}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {cost != null ? `₹${Number(cost).toLocaleString()}` : "—"}
                    </td>
                    {/* Status Dropdown Column */}
                    <td className="px-6 py-4">
                      {isUpdatingThisStatus ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                          <FaSpinner className="animate-spin" /> Updating...
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={currStatus}
                            disabled={isCompleted || isUpdatingThisStatus}
                            onChange={(e) => handleStatusChange(actId, e.target.value)}
                            className={`cursor-pointer rounded-xl py-1.5 pl-3 pr-8 text-xs font-bold transition-all duration-200 focus:bg-white focus:border-sky-400/80 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.16)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                              currStatus === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : currStatus === "IN_PROGRESS"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option
                              value="NOT_STARTED"
                              disabled={currStatus === "IN_PROGRESS"}
                            >
                              NOT_STARTED
                            </option>
                            <option
                              value="IN_PROGRESS"
                              disabled={
                                (() => {
                                  const currentProj = projects.find((p) => String(p.projectId) === String(selectedProject));
                                  const statusStr = currentProj ? String(currentProj.status || "").toUpperCase() : "";
                                  return statusStr !== "IN_PROGRESS";
                                })()
                              }
                            >
                              IN_PROGRESS
                            </option>
                            <option
                              value="COMPLETED"
                              disabled={currStatus === "NOT_STARTED"}
                            >
                              COMPLETED
                            </option>
                          </select>
                        </div>
                      )}
                    </td>
                    {/* Actions Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedActivity(a);
                            setViewModal(true);
                          }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-all hover:scale-110 hover:bg-sky-100"
                          title="View"
                        >
                          <FaEye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDepActivity(a);
                            setDepModalOpen(true);
                          }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all hover:scale-110 hover:bg-indigo-100"
                          title="Show Dependency"
                        >
                          <FaLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          disabled={isCompleted}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-all hover:scale-110 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title={isCompleted ? "Completed activity cannot be edited" : "Edit"}
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(actId)}
                          disabled={deletingId === actId}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition-all hover:scale-110 hover:bg-rose-100 disabled:opacity-40"
                          title="Delete"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Row count footer */}
        {displayed.length > 0 && (
          <div className="border-t border-slate-100/70 px-6 py-3 text-xs text-slate-400">
            Showing {displayed.length}{" "}
            {displayed.length === 1 ? "activity" : "activities"}
            {selectedProject &&
            projects.find((p) => String(p.projectId) === String(selectedProject))
              ? ` for "${
                  projects.find(
                    (p) => String(p.projectId) === String(selectedProject)
                  ).projectName
                }"`
              : ""}
          </div>
        )}
      </div>

      {/* ── Dependency Management Modal (full ManagerDependencies view) ── */}
      {depModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setDepModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]"
            style={{ marginLeft: "clamp(0px, 18rem, 22vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-200">
                  <FaLink size={15} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Dependency Management</p>
                  <p className="text-xs text-slate-400">
                    {projects.find((p) => String(p.projectId) === String(selectedProject))
                      ?.projectName || `Project #${selectedProject}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDepModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition cursor-pointer hover:bg-rose-50 hover:text-rose-500"
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Scrollable body with the full dependencies page */}
            <div className="flex-1 overflow-y-auto">
              <ManagerDependencies
                embedded
                initialProjectId={String(depActivity?.projectId ?? selectedProject ?? "")}
                targetActivityName={depActivity?.activityName || depActivity?.name || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerActivities;
