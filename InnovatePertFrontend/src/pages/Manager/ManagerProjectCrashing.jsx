import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaBolt,
  FaPlay,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSearch,
  FaRupeeSign,
  FaClock,
  FaProjectDiagram,
  FaChevronDown,
  FaLightbulb,
  FaHourglassHalf,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const getToken = () => localStorage.getItem("token");

/* Reusable label/value row used inside result panels */
function PanelRow({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100/90 pb-2.5 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <strong className={`text-sm font-bold text-right ${valueClass}`}>
        {value}
      </strong>
    </div>
  );
}

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

  // Marker position on the schedule range track (pure UI)
  const rangeSpan = currentDur - minAchievable;
  const markerPct =
    rangeSpan > 0 && !isNaN(targetVal)
      ? Math.min(100, Math.max(0, ((targetVal - minAchievable) / rangeSpan) * 100))
      : 0;

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

  /* ── Metric card configs ─────────────────────────────────────────── */
  const overviewCards = [
    {
      label: "Current Duration",
      value: overviewData?.currentDuration || 0,
      unit: "Days",
      grad: "from-sky-500 to-blue-600",
      glow: "shadow-sky-200/60",
      icon: <FaCalendarAlt />,
    },
    {
      label: "Max Possible Reduction",
      value: overviewData?.maxPossibleReduction || 0,
      unit: "Days",
      grad: "from-amber-400 to-orange-500",
      glow: "shadow-amber-200/60",
      icon: <FaArrowDown />,
    },
    {
      label: "Min Achievable Duration",
      value: overviewData?.minAchievableDuration || 0,
      unit: "Days",
      grad: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-200/60",
      icon: <FaCheckCircle />,
    },
  ];

  const resultCards = [
    {
      label: "Current Duration",
      value: `${crashingResult?.currentDuration} Days`,
      grad: "from-sky-500 to-blue-600",
      glow: "shadow-sky-200/60",
      icon: <FaCalendarAlt />,
      accent: "text-sky-600",
    },
    {
      label: "Target Duration",
      value: `${crashingResult?.newTargetDuration} Days`,
      grad: "from-violet-500 to-purple-500",
      glow: "shadow-violet-200/60",
      icon: <FaClock />,
      accent: "text-violet-600",
    },
    {
      label: "Time Saved",
      value: `${crashingResult?.totalTimeSaved} Days`,
      grad: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-200/60",
      icon: <FaCheckCircle />,
      accent: "text-emerald-600",
    },
    {
      label: "Additional Cost",
      value: `₹${crashingResult?.totalAdditionalCost?.toLocaleString()}`,
      grad: "from-rose-400 to-pink-500",
      glow: "shadow-rose-200/60",
      icon: <FaRupeeSign />,
      accent: "text-rose-600",
    },
  ];

  const recommended = (displayedActivities || []).filter((a) => a.recommended);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ═══════════ 1. HEADER + PROJECT SELECTOR ═══════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200/70">
            <FaBolt size={22} />
          </div> */}
          <div>
            {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Schedule Optimization Module
            </span> */}
            <h1 className="mt-1.5 text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              Project{" "}
              <span className="bg-linear-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Crashing
              </span>
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Optimize project duration with minimum additional cost by
              selecting the most cost-effective crashable activities.
            </p>
          </div>
        </div>

        {/* Project selector */}
        <div className="flex items-center gap-3">
          {/* <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-400">
            Select Project
          </span> */}
          <div className="relative">
            <FaProjectDiagram className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-cyan-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
              className="glass min-w-60 appearance-none rounded-2xl py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer border"
            >
              <option value="">-- Select a Project --</option>
              {projects.map((p) => (
                <option key={p.projectId || p.id} value={p.projectId || p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        /* ═══════════ EMPTY STATE ═══════════ */
        <div className="glass flex flex-col items-center justify-center gap-4 rounded-3xl p-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-cyan-100 to-blue-100 text-cyan-600 ring-8 ring-cyan-50/80">
            <FaProjectDiagram size={26} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Select a project to begin
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
              Choose a project from the dropdown above to inspect crashable
              activities, calculate minimum achievable durations, and run cost
              optimizations.
            </p>
          </div>
        </div>
      ) : overviewLoading ? (
        /* ═══════════ LOADING STATE ═══════════ */
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl p-14">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
          <p className="text-sm font-semibold text-slate-500">
            Fetching project crashing metrics…
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════ 2. PROJECT OVERVIEW METRIC CARDS ═══════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewCards.map((c) => (
              <div
                key={c.label}
                className="relative overflow-hidden rounded-2xl border bg-white/70 border-slate-200/70 backdrop-blur-xl px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber-200"
              >
                <div
                  className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-linear-to-br ${c.grad} blur-3xl opacity-15`}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {c.label}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {c.value}{" "}
                      <span className="text-sm font-semibold text-slate-400">
                        {c.unit}
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-400">Schedule estimate</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${c.grad} text-white shadow-md ${c.glow}`}
                  >
                    <span className="text-base">{c.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════ 3. TARGET DURATION PANEL ═══════════ */}
          <div className="glass rounded-3xl p-6 lg:p-7">
            <div className="flex items-center gap-3 border-b border-slate-200/70 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600">
                <FaHourglassHalf size={16} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Set Target Duration
                </h3>
                <p className="text-xs font-medium text-slate-400">
                  Define how far you want to compress the schedule
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-end gap-5">
              <div className="flex-1 max-w-sm">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  New Target Duration (Days)
                </label>
                <div className="relative">
                  <FaClock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-300" />
                  <input
                    type="number"
                    value={targetDurationInput}
                    onChange={(e) => setTargetDurationInput(e.target.value)}
                    placeholder="e.g. 30"
                    step="0.1"
                    min={minAchievable}
                    max={currentDur - 0.1}
                    className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition
                      ${
                        isInvalid
                          ? "border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          : "glass-input"
                      }`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Must be ≥ minimum achievable duration (
                  <strong className="text-slate-600">{minAchievable} days</strong>
                  )
                </p>
              </div>

              <button
                onClick={handleRunCrash}
                disabled={crashingLoading || isInvalid || !targetDurationInput}
                className="btn-shine flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-400
                  px-7 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200
                  hover:shadow-cyan-300 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0
                  transition-all duration-200 cursor-pointer"
              >
                {crashingLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Calculating…
                  </>
                ) : (
                  <>
                    <FaPlay size={11} /> Run Crash Analysis
                  </>
                )}
              </button>
            </div>

            {/* Schedule compression range track (visual only) */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="text-emerald-600">
                  <FaArrowUp className="mr-1 inline" size={9} />
                  Min {minAchievable}d
                </span>
                <span className="text-sky-600">
                  Current {currentDur}d
                </span>
              </div>
              <div className="relative mt-2 h-2.5 rounded-full bg-slate-200/80">
                <div className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-400 via-cyan-300 to-sky-400" />
                {!isNaN(targetVal) && targetDurationInput !== "" && (
                  <div
                    className="absolute -top-1.5 h-5.5 w-5.5 -translate-x-1/2 rounded-full border-4 border-white bg-cyan-500 shadow-lg shadow-cyan-200 transition-all duration-300"
                    style={{ left: `${markerPct}%` }}
                  />
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Draggable-free guide: the marker shows where your target sits
                within the crashable range.
              </p>
            </div>

            {(isInvalid || validationError || apiError) && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                <FaExclamationTriangle className="shrink-0" />
                {validationError || (isInvalid ? validationMessage : apiError)}
              </div>
            )}
          </div>

          {/* ═══════════ NO CRASHABLE ACTIVITIES ═══════════ */}
          {overviewData?.activities?.length === 0 && (
            <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl border-amber-200/70 bg-amber-50/60 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
                <FaExclamationTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  No Crashable Activities
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  This project has no activities where Crash Time &lt; Normal
                  Time. Duration cannot be reduced.
                </p>
              </div>
            </div>
          )}

          {crashingResult && (
            <div className="space-y-6">
              {/* ═══════════ 4. RESULT SUMMARY CARDS ═══════════ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {resultCards.map((c) => (
                  <div
                    key={c.label}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-200"
                  >
                    <div
                      className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-linear-to-br ${c.grad} blur-3xl opacity-15`}
                    />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {c.label}
                        </p>
                        <p className={`mt-1 text-xl font-bold ${c.accent}`}>
                          {c.value}
                        </p>
                      </div>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${c.grad} text-white shadow-md ${c.glow}`}
                      >
                        <span className="text-sm">{c.icon}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ═══════════ 5. CRASH RECOMMENDATION TABLE ═══════════ */}
              <div className="glass overflow-hidden rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/70 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600">
                      <FaChartLine size={16} />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Crash Recommendation Table
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        Sorted by Cost/Day Saved · Green rows = recommended
                        activities
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-300" />
                    <input
                      type="text"
                      placeholder="Search activity…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="glass-input w-full sm:w-64 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300 border"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-225 text-sm">
                    <thead>
                      <tr className="table-gradient-head text-left">
                        <th className="px-4 py-3.5">#</th>
                        <th className="px-4 py-3.5">Activity</th>
                        <th className="px-4 py-3.5">Normal Time</th>
                        <th className="px-4 py-3.5">Crash Time</th>
                        <th className="px-4 py-3.5">Time Saved</th>
                        <th className="px-4 py-3.5">Normal Cost</th>
                        <th className="px-4 py-3.5">Crash Cost</th>
                        <th className="px-4 py-3.5">Extra Cost</th>
                        <th className="px-4 py-3.5">₹/Day</th>
                        <th className="px-4 py-3.5">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {displayedActivities.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-6 py-14 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <FaSearch size={18} />
                              </div>
                              <p className="text-sm font-semibold text-slate-500">
                                No matching activities found.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayedActivities.map((act, idx) => {
                          const isRec = act.recommended;
                          return (
                            <tr
                              key={act.activityId || idx}
                              className={`glass-table-row transition-colors ${
                                isRec ? "bg-emerald-50/50" : ""
                              }`}
                            >
                              <td className="px-4 py-3.5 text-center">
                                {act.priority ? (
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-400 text-xs font-black text-white shadow-sm">
                                    {act.priority}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-900">
                                {act.activityName}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                {act.normalTime}d
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                {act.crashTime}d
                              </td>
                              <td className="px-4 py-3.5 font-bold text-emerald-600">
                                {act.timeSaved}d
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                ₹{act.normalCost?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                ₹{act.crashCost?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-rose-500">
                                ₹{act.additionalCost?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 font-black text-indigo-600">
                                ₹{act.costSlope?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5">
                                {isRec ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                                    <FaCheckCircle size={9} />{" "}
                                    {act.recommendation || "Crash First"}
                                  </span>
                                ) : (
                                  <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
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

              {/* ═══════════ 6. FINANCIAL & SCHEDULE PANELS ═══════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-3xl p-6">
                  <h4 className="mb-5 flex items-center gap-3 text-sm font-black text-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500">
                      <FaRupeeSign size={15} />
                    </span>
                    Financial Impact
                  </h4>
                  <div className="space-y-3">
                    <PanelRow
                      label="Baseline Normal Cost"
                      value={`₹${displayedActivities
                        .reduce((acc, a) => acc + (a.normalCost || 0), 0)
                        .toLocaleString()}`}
                    />
                    <PanelRow
                      label="Total Crash Budget"
                      value={`₹${(
                        displayedActivities.reduce(
                          (acc, a) => acc + (a.normalCost || 0),
                          0
                        ) + (crashingResult.totalAdditionalCost || 0)
                      ).toLocaleString()}`}
                    />
                    <PanelRow
                      label="Net Additional Investment"
                      value={`+₹${crashingResult.totalAdditionalCost?.toLocaleString()}`}
                      valueClass="text-rose-600"
                    />
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-rose-400 to-pink-500 transition-all duration-700"
                      style={{
                        width: `${(() => {
                          const baseline = displayedActivities.reduce(
                            (acc, a) => acc + (a.normalCost || 0),
                            0
                          );
                          const total = baseline + (crashingResult.totalAdditionalCost || 0);
                          return total > 0
                            ? Math.min(100, ((crashingResult.totalAdditionalCost || 0) / total) * 100)
                            : 0;
                        })()}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Additional cost as share of total crash budget
                  </p>
                </div>

                <div className="glass rounded-3xl p-6">
                  <h4 className="mb-5 flex items-center gap-3 text-sm font-black text-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-500">
                      <FaClock size={15} />
                    </span>
                    Schedule Optimization
                  </h4>
                  <div className="space-y-3">
                    <PanelRow
                      label="Original Schedule"
                      value={`${crashingResult.currentDuration} Days`}
                    />
                    <PanelRow
                      label="Target Duration"
                      value={`${crashingResult.newTargetDuration} Days`}
                      valueClass="text-violet-600"
                    />
                    <PanelRow
                      label="Compression Achieved"
                      value={`−${crashingResult.totalTimeSaved} Days`}
                      valueClass="text-emerald-600"
                    />
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        <span>Original</span>
                        <span>{crashingResult.currentDuration}d</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-full rounded-full bg-linear-to-r from-sky-400 to-blue-500" />
                      </div>
                    </div>
                    <FaArrowDown className="text-slate-300" size={14} />
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        <span>Target</span>
                        <span>{crashingResult.newTargetDuration}d</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                          style={{
                            width: `${
                              crashingResult.currentDuration > 0
                                ? Math.min(
                                    100,
                                    (crashingResult.newTargetDuration /
                                      crashingResult.currentDuration) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Target bar length vs. original
                  </p>
                </div>
              </div>

              {/* ═══════════ 7. NORMAL VS CRASH BAR CHART ═══════════ */}
              <div className="glass rounded-3xl p-6 lg:p-7">
                <h3 className="mb-6 flex items-center gap-3 text-sm font-black text-slate-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <FaChartLine size={15} />
                  </span>
                  Normal vs Crash Time — Recommended Activities
                </h3>

                {recommended.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FaChartLine size={18} />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                      No recommended activities to chart.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {recommended.map((act, idx) => {
                      const maxVal = Math.max(act.normalTime, 1);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-linear-to-br from-amber-400 to-orange-400 text-[9px] font-black text-white">
                                {idx + 1}
                              </span>
                              {act.activityName}
                            </span>
                            <span className="text-slate-400">
                              Saved: {act.timeSaved}d · ₹
                              {act.costSlope}/day
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-16 text-[10px] font-semibold text-slate-400">
                              Normal
                            </span>
                            <div className="h-3.5 flex-1 overflow-hidden rounded-lg bg-slate-100">
                              <div
                                className="flex h-full items-center justify-end rounded-lg bg-linear-to-r from-indigo-500 to-blue-500 pr-2 text-[9px] font-bold text-white transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (act.normalTime / maxVal) * 100
                                  )}%`,
                                }}
                              >
                                {act.normalTime}d
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-16 text-[10px] font-semibold text-slate-400">
                              Crashed
                            </span>
                            <div className="h-3.5 flex-1 overflow-hidden rounded-lg bg-slate-100">
                              <div
                                className="flex h-full items-center justify-end rounded-lg bg-linear-to-r from-emerald-400 to-teal-400 pr-2 text-[9px] font-bold text-white transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (act.crashTime / maxVal) * 100
                                  )}%`,
                                }}
                              >
                                {act.crashTime}d
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ═══════════ 8. SYSTEM RECOMMENDATION ═══════════ */}
              <div className="rounded-3xl border border-emerald-200/80 bg-linear-to-br from-emerald-50 to-teal-50/60 p-6 lg:p-7 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200">
                    <FaLightbulb size={18} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        System Recommendation
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        The highlighted activities provide the minimum
                        additional cost while achieving the requested target
                        duration.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recommended.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                        >
                          <FaCheckCircle className="text-[10px] text-emerald-500" />{" "}
                          {a.activityName}
                        </span>
                      ))}
                      {recommended.length === 0 && (
                        <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 shadow-sm">
                          No activities need crashing
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-emerald-200/60 pt-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Additional Cost
                        </p>
                        <p className="text-lg font-black text-rose-500">
                          ₹{crashingResult.totalAdditionalCost?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Time Saved
                        </p>
                        <p className="text-lg font-black text-emerald-600">
                          {crashingResult.totalTimeSaved} Days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════ 9. SUBMIT / CANCEL BAR ═══════════ */}
              <div className="glass flex flex-col items-center justify-between gap-4 rounded-3xl p-5 sm:flex-row">
                <div className="text-xs text-slate-500">
                  {submitSuccess ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                      <FaCheckCircle size={14} /> Saved successfully!
                    </span>
                  ) : (
                    <span>
                      Click <strong>Submit</strong> to save this analysis, or{" "}
                      <strong>Cancel</strong> to discard.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelAnalysis}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    <FaTimesCircle size={12} /> Cancel
                  </button>
                  <button
                    onClick={handleSubmitAnalysis}
                    disabled={submitting || submitSuccess}
                    className="btn-shine flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-amber-300 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />{" "}
                        Saving…
                      </>
                    ) : submitSuccess ? (
                      <>
                        <FaCheckCircle size={12} /> Saved
                      </>
                    ) : (
                      <>
                        <FaCheckCircle size={12} /> Submit
                      </>
                    )}
                  </button>
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  <FaExclamationTriangle className="shrink-0" /> {submitError}
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
