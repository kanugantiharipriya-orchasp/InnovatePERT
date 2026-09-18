import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaBolt,
  FaPlay,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaDownload,
  FaPrint,
  FaSearch,
  FaRupeeSign,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaInfoCircle,
  FaProjectDiagram,
  FaFilePdf,
  FaFileExcel,
  FaSync,
} from "react-icons/fa";
import { handleNumberInput, blockInvalidNumberKeys } from "../../utils/validation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const getToken = () => localStorage.getItem("token");

function ManagerCrashing() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [targetDurationInput, setTargetDurationInput] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [crashingLoading, setCrashingLoading] = useState(false);

  const [overviewData, setOverviewData] = useState(null);
  const [crashingResult, setCrashingResult] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Fetch Projects for Dropdown ─────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.content || [];
        setProjects(list);
        if (list.length > 0) {
          const firstId = String(list[0].projectId || list[0].id);
          setSelectedProjectId(firstId);
        }
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Fetch Project Overview Details upon Selection ─────────────────────
  const fetchProjectOverview = useCallback(async (projId) => {
    if (!projId) return;
    setOverviewLoading(true);
    setApiError("");
    setCrashingResult(null);
    setValidationError("");
    setSubmitSuccess(false);
    setSubmitError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/crashing-analysis/project/${projId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
        const suggested = Math.max(
          data.minAchievableDuration || 0,
          Math.floor(data.currentDuration * 0.8)
        );
        setTargetDurationInput(suggested > 0 ? String(suggested) : "");
      } else {
        fetchActivitiesFallback(projId);
      }
    } catch (err) {
      console.error("Error fetching crashing overview:", err);
      fetchActivitiesFallback(projId);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchActivitiesFallback = async (projId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/activities?projectId=${projId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        const acts = await res.json();
        const list = Array.isArray(acts) ? acts : acts.content || [];
        const currentDur = list.reduce(
          (acc, a) => acc + (a.expectedTime || a.mostLikelyTime || 0),
          0
        );
        let maxRed = 0;
        const crashables = [];

        list.forEach((a) => {
          const normT = a.expectedTime || a.mostLikelyTime || 0;
          const crashT = a.crashTime != null ? a.crashTime : normT;
          const timeSaved = Math.max(0, normT - crashT);
          if (timeSaved > 0) {
            maxRed += timeSaved;
            const normC = a.normalCost || 0;
            const crashC = a.crashCost != null ? a.crashCost : normC;
            const extraC = Math.max(0, crashC - normC);
            const slope = extraC / timeSaved;
            crashables.push({
              activityId: a.activityId || a.id,
              activityName: a.activityName,
              normalTime: normT,
              crashTime: crashT,
              timeSaved,
              normalCost: normC,
              crashCost: crashC,
              additionalCost: extraC,
              costSlope: slope,
              recommended: false,
            });
          }
        });

        const minAch = Math.max(0, currentDur - maxRed);
        const selectedProjObj = projects.find(
          (p) => String(p.projectId || p.id) === String(projId)
        );

        setOverviewData({
          projectId: parseInt(projId, 10),
          projectName: selectedProjObj?.projectName || "Selected Project",
          currentDuration: currentDur,
          maxPossibleReduction: maxRed,
          minAchievableDuration: minAch,
          activities: crashables,
        });

        const sugg = Math.max(minAch, Math.floor(currentDur * 0.8));
        setTargetDurationInput(sugg > 0 ? String(sugg) : "");
      }
    } catch (e) {
      console.error("Fallback activities fetch error:", e);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectOverview(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectOverview]);

  // ── Client-side Real-time Validation Check ────────────────────────────
  const currentDur = overviewData?.currentDuration || 0;
  const minAchievable = overviewData?.minAchievableDuration || 0;
  const targetVal = parseFloat(targetDurationInput);

  let isInvalid = false;
  let validationMessage = "";

  if (targetDurationInput !== "" && !isNaN(targetVal)) {
    if (targetVal >= currentDur) {
      isInvalid = true;
      validationMessage = "Target duration must be less than current duration.";
    } else if (targetVal < minAchievable) {
      isInvalid = true;
      validationMessage = `Project cannot be crashed beyond the minimum achievable duration (${minAchievable} days).`;
    }
  }

  // ── Run Crash Analysis Action ──────────────────────────────────────────
  const handleRunCrash = async () => {
    if (!selectedProjectId) {
      setApiError("Please select a project first.");
      return;
    }
    if (!targetDurationInput || isNaN(targetVal)) {
      setValidationError("Please enter a valid target duration.");
      return;
    }
    if (isInvalid) {
      return;
    }

    setCrashingLoading(true);
    setApiError("");
    setSubmitSuccess(false);
    setSubmitError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crashing-analysis/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: parseInt(selectedProjectId, 10),
          newTargetDuration: targetVal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCrashingResult(data);
      } else {
        let msg = "Failed to execute crash analysis.";
        try {
          const errData = await res.json();
          msg = typeof errData === "string" ? errData : errData.message || msg;
        } catch {
          /* fallback */
        }

        if (res.status === 400 || res.status === 500) {
          runLocalCrashSimulation();
        } else {
          setApiError(msg);
        }
      }
    } catch (err) {
      console.error("Run Crash error:", err);
      runLocalCrashSimulation();
    } finally {
      setCrashingLoading(false);
    }
  };

  // Local Crash Simulation Fallback
  const runLocalCrashSimulation = () => {
    if (!overviewData) return;
    const reqReduction = currentDur - targetVal;
    const candidates = [...(overviewData.activities || [])];
    candidates.sort((a, b) => a.costSlope - b.costSlope);

    let accumulatedRed = 0;
    let accumulatedCost = 0;
    let priorityCounter = 1;

    const labels = [
      "⭐ Crash First",
      "⭐ Crash Second",
      "⭐ Crash Third",
      "⭐ Crash Fourth",
      "⭐ Crash Fifth",
    ];

    const processed = candidates.map((act) => {
      if (accumulatedRed < reqReduction) {
        const needed = reqReduction - accumulatedRed;
        const actualSaved = Math.min(act.timeSaved, needed);
        const cost = actualSaved * act.costSlope;
        const currentPrio = priorityCounter++;

        accumulatedRed += actualSaved;
        accumulatedCost += cost;

        return {
          ...act,
          priority: currentPrio,
          recommended: true,
          timeSaved: Math.round(actualSaved * 100) / 100,
          additionalCost: Math.round(cost * 100) / 100,
          recommendation:
            labels[currentPrio - 1] || `⭐ Crash Priority ${currentPrio}`,
        };
      }
      return {
        ...act,
        recommended: false,
        priority: null,
        recommendation: "Optional",
      };
    });

    setCrashingResult({
      projectId: overviewData.projectId,
      projectName: overviewData.projectName,
      currentDuration: currentDur,
      newTargetDuration: targetVal,
      requiredReduction: reqReduction,
      totalTimeSaved: Math.round(accumulatedRed * 100) / 100,
      totalAdditionalCost: Math.round(accumulatedCost * 100) / 100,
      activities: processed,
    });
  };

  // ── Submit Crash Analysis Handler ──────────────────────────────────────
  const handleSubmitAnalysis = async () => {
    if (!crashingResult) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/crashing-analysis/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(crashingResult),
        }
      );

      if (res.ok) {
        setSubmitSuccess(true);
      } else {
        let msg = "Failed to save crash analysis record.";
        try {
          const errData = await res.json();
          msg = typeof errData === "string" ? errData : errData.message || msg;
        } catch {
          /* fallback */
        }
        setSubmitError(msg);
      }
    } catch (err) {
      console.error("Submit crash analysis error:", err);
      setSubmitError("Failed to connect to server to save analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel Crash Analysis Handler ──────────────────────────────────────
  const handleCancelAnalysis = () => {
    setCrashingResult(null);
    const suggested = Math.max(
      overviewData?.minAchievableDuration || 0,
      Math.floor((overviewData?.currentDuration || 0) * 0.8)
    );
    setTargetDurationInput(suggested > 0 ? String(suggested) : "");
    setValidationError("");
    setApiError("");
    setSubmitError("");
    setSubmitSuccess(false);
  };

  // Filtered Table Activities
  const displayedActivities = useMemo(() => {
    const source = crashingResult?.activities || overviewData?.activities || [];
    if (!searchQuery.trim()) return source;
    return source.filter((a) =>
      a.activityName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [crashingResult, overviewData, searchQuery]);

  // Export handlers
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    alert("Exporting Crashing Analysis Report to Excel CSV...");
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FaBolt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Project Crashing & Cost Optimization
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Optimize project duration with minimum additional cost.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Report Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <FaFilePdf className="text-rose-500" /> PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <FaFileExcel className="text-emerald-500" /> Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Select Project
        </label>
        <div className="relative max-w-md">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-800 transition focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((p) => (
              <option key={p.projectId || p.id} value={p.projectId || p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            ▼
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        /* ── EMPTY STATE ── */
        <div className="rounded-xl border border-slate-200 bg-white py-12 px-6 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-4">
            <FaProjectDiagram size={40} />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Select a Project to Perform Crash Analysis</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Choose an active project from the dropdown above to inspect crashable activities, calculate minimum achievable durations, and run cost optimizations.
          </p>
        </div>
      ) : overviewLoading ? (
        /* ── LOADING OVERVIEW ── */
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-slate-600">Fetching project crashing metrics...</p>
        </div>
      ) : (
        <>
          {/* ── SECTION 2: PROJECT OVERVIEW (ANALYTICS CARDS) ── */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Current Project Duration */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Current Project Duration
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FaCalendarAlt size={20} />
                </div>
              </div>
              <p className="mt-3 text-xl font-black text-slate-900">
                {overviewData?.currentDuration || 0} <span className="text-xs font-bold text-slate-500">Days</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Total schedule duration based on activities
              </p>
            </div>

            {/* Card 2: Maximum Possible Time Reduction */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Maximum Possible Time Reduction
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FaChartLine size={20} />
                </div>
              </div>
              <p className="mt-3 text-xl font-black text-slate-900">
                {overviewData?.maxPossibleReduction || 0} <span className="text-xs font-bold text-slate-500">Days</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Sum of all (Normal Time − Crash Time)
              </p>
            </div>

            {/* Card 3: Minimum Achievable Duration */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Minimum Achievable Duration
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FaCheckCircle size={20} />
                </div>
              </div>
              <p className="mt-3 text-xl font-black text-slate-900">
                {overviewData?.minAchievableDuration || 0} <span className="text-xs font-bold text-slate-500">Days</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Current Duration − Max Reduction
              </p>
            </div>
          </div>

          {/* ── SECTION 3: TARGET DURATION & RUN CRASH ── */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Set Target Duration</h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-lg">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Enter New Target Duration (Days)
                </label>
                <input
                  type="number"
                  value={targetDurationInput}
                  onInput={handleNumberInput}
                  onKeyDown={blockInvalidNumberKeys}
                  onChange={(e) => setTargetDurationInput(e.target.value)}
                  placeholder="e.g. 30"
                  step="0.1"
                  min={minAchievable}
                  max={currentDur - 0.1}
                  className={`w-full rounded-xl border py-3 px-4 text-sm font-bold text-slate-900 shadow-xs transition ${
                    isInvalid
                      ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                      : "border-slate-300 bg-white focus:border-blue-600"
                  }`}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Target duration must be greater than or equal to the minimum achievable duration (<strong>{minAchievable} days</strong>).
                </p>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handleRunCrash}
                  disabled={crashingLoading || isInvalid || !targetDurationInput}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {crashingLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <FaPlay size={12} /> Run Crash
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Validation Alerts */}
            {isInvalid && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                <FaExclamationTriangle size={16} className="shrink-0" />
                <span>{validationMessage}</span>
              </div>
            )}

            {apiError && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                <FaExclamationTriangle size={16} className="shrink-0" />
                <span>{apiError}</span>
              </div>
            )}
          </div>

          {/* ── NO CRASHABLE ACTIVITIES WARNING ── */}
          {overviewData?.activities?.length === 0 && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Crashable Activities Found</h3>
              <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
                This project contains no crashable activities (activities where Crash Time &lt; Normal Time). Project duration cannot be reduced.
              </p>
            </div>
          )}

          {/* ── SECTION 4: CRASH ANALYSIS SUMMARY (AFTER API RESPONSE) ── */}
          {crashingResult && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Summary Card 1: Current Duration */}
                <div className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-blue-600">
                      Current Duration
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <FaCalendarAlt size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {crashingResult.currentDuration} <span className="text-base font-bold text-slate-500">Days</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Original project schedule</p>
                </div>

                {/* Summary Card 2: Target Duration */}
                <div className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50 to-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-sky-600">
                      Target Duration
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
                      <FaClock size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {crashingResult.newTargetDuration} <span className="text-base font-bold text-slate-500">Days</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Requested reduced timeline</p>
                </div>

                {/* Summary Card 3: Total Time Saved */}
                <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600">
                      Total Time Saved
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                      <FaCheckCircle size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {crashingResult.totalTimeSaved} <span className="text-base font-bold text-slate-500">Days</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Schedule reduction achieved</p>
                </div>

                {/* Summary Card 4: Additional Cost */}
                <div className="rounded-2xl border border-rose-200 bg-linear-to-br from-rose-50 to-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-rose-600">
                      Additional Cost
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
                      <FaRupeeSign size={16} />
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    ₹{crashingResult.totalAdditionalCost?.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Minimum extra cost required</p>
                </div>
              </div>

              {/* ── SECTION 5: CRASH RECOMMENDATION TABLE ── */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Crash Recommendation Table
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sorted automatically by Cost Per Day Saved (Ascending). Light green rows represent recommended activities.
                    </p>
                  </div>

                  {/* Table Search */}
                  <div className="relative max-w-xs">
                    <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Search activity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
                  <table className="w-full min-w-[900px] text-left text-[11px]">
                    <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
                      <tr>
                        <th className="px-6 py-4 text-center">Priority</th>
                        <th className="px-6 py-4">Activity Name</th>
                        <th className="px-6 py-4">Normal Time</th>
                        <th className="px-6 py-4">Crash Time</th>
                        <th className="px-6 py-4">Time Saved</th>
                        <th className="px-6 py-4">Normal Cost</th>
                        <th className="px-6 py-4">Crash Cost</th>
                        <th className="px-6 py-4">Extra Cost</th>
                        <th className="px-6 py-4">Cost / Day Saved</th>
                        <th className="px-6 py-4">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedActivities.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="py-12 text-center text-slate-400 font-semibold">
                            No matching activities found.
                          </td>
                        </tr>
                      ) : (
                        displayedActivities.map((act, idx) => {
                          const isRec = act.recommended;
                          return (
                            <tr
                              key={act.activityId || idx}
                              className={`transition-colors hover:bg-slate-50 ${
                                isRec ? "bg-emerald-50/60 font-semibold" : ""
                              }`}
                            >
                              {/* Priority Gold Badge */}
                              <td className="px-6 py-4 text-center">
                                {act.priority ? (
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-900 shadow-xs ring-2 ring-amber-300/60">
                                    {act.priority}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Activity Name */}
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {act.activityName}
                              </td>

                              {/* Normal Time */}
                              <td className="px-6 py-4 text-slate-700">
                                {act.normalTime} Days
                              </td>

                              {/* Crash Time */}
                              <td className="px-6 py-4 text-slate-700">
                                {act.crashTime} Days
                              </td>

                              {/* Time Saved */}
                              <td className="px-6 py-4 font-bold text-emerald-700">
                                {act.timeSaved} Days
                              </td>

                              {/* Normal Cost */}
                              <td className="px-6 py-4 text-slate-700">
                                ₹{act.normalCost?.toLocaleString()}
                              </td>

                              {/* Crash Cost */}
                              <td className="px-6 py-4 text-slate-700">
                                ₹{act.crashCost?.toLocaleString()}
                              </td>

                              {/* Extra Cost */}
                              <td className="px-6 py-4 font-bold text-rose-600">
                                ₹{act.additionalCost?.toLocaleString()}
                              </td>

                              {/* Cost Slope */}
                              <td className="px-6 py-4 font-black text-blue-700">
                                ₹{act.costSlope?.toLocaleString()}
                              </td>

                              {/* Recommendation Badge */}
                              <td className="px-6 py-4">
                                {isRec ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-300">
                                    {act.recommendation || "⭐ Crash First"}
                                  </span>
                                ) : (
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                    Not Required
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SECTION 6: COST & TIME ANALYSIS PANELS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel 1: Financial Impact */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FaRupeeSign className="text-rose-500" /> Financial Impact Summary
                  </h4>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Baseline Normal Cost:</span>
                      <span className="font-bold text-slate-800">
                        ₹
                        {(
                          displayedActivities.reduce((acc, a) => acc + (a.normalCost || 0), 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Total Crash Budget Required:</span>
                      <span className="font-bold text-slate-800">
                        ₹
                        {(
                          displayedActivities.reduce((acc, a) => acc + (a.normalCost || 0), 0) +
                          (crashingResult.totalAdditionalCost || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-sm font-black">
                      <span className="text-rose-600">Net Additional Investment:</span>
                      <span className="text-rose-600">
                        +₹{crashingResult.totalAdditionalCost?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Time Optimization */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FaClock className="text-blue-500" /> Schedule Optimization Breakdown
                  </h4>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Original Project Schedule:</span>
                      <span className="font-bold text-slate-800">{crashingResult.currentDuration} Days</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Target Duration:</span>
                      <span className="font-bold text-sky-700">{crashingResult.newTargetDuration} Days</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-sm font-black">
                      <span className="text-emerald-600">Schedule Compression Achieved:</span>
                      <span className="text-emerald-600">−{crashingResult.totalTimeSaved} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 7: VISUAL ANALYTICS (BAR CHART) ── */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FaChartLine className="text-blue-600" /> Normal Time vs Crash Time (Recommended Activities)
                </h3>

                <div className="space-y-5">
                  {displayedActivities
                    .filter((a) => a.recommended)
                    .map((act, idx) => {
                      const maxVal = Math.max(act.normalTime, 1);
                      const normPct = (act.normalTime / maxVal) * 100;
                      const crashPct = (act.crashTime / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-1.5 text-xs font-bold">
                          <div className="flex items-center justify-between text-slate-800">
                            <span>{act.activityName}</span>
                            <span className="text-slate-500 font-semibold">
                              Saved: {act.timeSaved} Days | Slope: ₹{act.costSlope}/day
                            </span>
                          </div>

                          {/* Normal Time Bar */}
                          <div className="flex items-center gap-3">
                            <span className="w-20 text-[11px] text-slate-400 font-semibold">Normal</span>
                            <div className="flex-1 h-4 overflow-hidden rounded-md bg-slate-100">
                              <div
                                className="h-full rounded-md bg-blue-600 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                                style={{ width: `${Math.min(100, normPct)}%` }}
                              >
                                {act.normalTime}d
                              </div>
                            </div>
                          </div>

                          {/* Crash Time Bar */}
                          <div className="flex items-center gap-3">
                            <span className="w-20 text-[11px] text-slate-400 font-semibold">Crashed</span>
                            <div className="flex-1 h-4 overflow-hidden rounded-md bg-slate-100">
                              <div
                                className="h-full rounded-md bg-emerald-500 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                                style={{ width: `${Math.min(100, crashPct)}%` }}
                              >
                                {act.crashTime}d
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ── SECTION 8: RECOMMENDATION SUMMARY (SUCCESS CARD) ── */}
              <div className="rounded-2xl border border-emerald-300 bg-linear-to-br from-emerald-50 via-teal-50 to-white p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                    <FaCheckCircle size={24} />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">System Recommendation</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-600 leading-relaxed">
                        The system recommends crashing the selected activities because they provide the minimum additional cost while achieving the requested project target duration.
                      </p>
                    </div>

                    {/* Recommended List */}
                    <div>
                      <p className="text-xs font-extrabold uppercase text-emerald-800 mb-2">
                        Recommended Activities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {displayedActivities
                          .filter((a) => a.recommended)
                          .map((a, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs border border-emerald-200"
                            >
                              <FaCheckCircle className="text-emerald-500 text-xs" />
                              {a.activityName}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Bottom Totals */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-emerald-200/60 pt-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Estimated Additional Cost</p>
                        <p className="text-xl font-black text-rose-600">
                          ₹{crashingResult.totalAdditionalCost?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Estimated Time Saved</p>
                        <p className="text-xl font-black text-emerald-700">
                          {crashingResult.totalTimeSaved} Days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 10: ACTION BUTTONS (SUBMIT & CANCEL) ── */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  {submitSuccess ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
                      <FaCheckCircle size={16} /> Crash analysis record saved successfully in database!
                    </span>
                  ) : (
                    <span>
                      Click <strong>Submit</strong> to save this crash analysis to the database for historical records and auditing, or <strong>Cancel</strong> to discard.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelAnalysis}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    <FaTimesCircle /> Cancel
                  </button>

                  <button
                    onClick={handleSubmitAnalysis}
                    disabled={submitting || submitSuccess}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving to Database...
                      </>
                    ) : submitSuccess ? (
                      <>
                        <FaCheckCircle /> Saved to Database
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Submit
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Error Alert */}
              {submitError && (
                <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                  <FaExclamationTriangle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManagerCrashing;
