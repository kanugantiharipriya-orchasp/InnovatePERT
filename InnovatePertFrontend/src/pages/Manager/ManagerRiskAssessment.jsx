import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useScrollLock from "../../utils/useScrollLock";
import {
  FaSearch,
  FaTasks,
  FaExclamationTriangle,
  FaCheckCircle,
  FaDatabase,
  FaCalculator,
  FaEye,
  FaTimes,
  FaLightbulb,
  FaProjectDiagram,
  FaShieldAlt,
  FaChartLine,
  FaChevronDown,
  FaFilePdf,
} from "react-icons/fa";
import { handleNumberInput, blockInvalidNumberKeys } from "../../utils/validation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

/* ── Risk styling helpers (light glass palette) ───────────────────── */
const RISK_PILL = {
  HIGH: "bg-rose-50 text-rose-600 border-rose-200/80",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200/80",
  LOW: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
};
const RISK_DOT = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};
const riskPill = (level) =>
  RISK_PILL[String(level || "").toUpperCase()] ||
  "bg-slate-100 text-slate-500 border-slate-200/80";
const riskDot = (level) =>
  RISK_DOT[String(level || "").toUpperCase()] || "bg-slate-400";

/* One label/value row used inside the details grid */
function DetailRow({ label, value, accent = "text-slate-900" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100/90 pb-2.5 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <strong className={`text-sm font-bold text-right ${accent}`}>
        {value}
      </strong>
    </div>
  );
}

export default function RiskAssessment() {
  const navigate = useNavigate();
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Cache analyzed project records by projectId
  const [riskRecordsMap, setRiskRecordsMap] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  // What-if Analysis State
  const [whatIfTarget, setWhatIfTarget] = useState("");
  const [whatIfResult, setWhatIfResult] = useState(null);

  // View Details Modal State
  const [selectedDetail, setSelectedDetail] = useState(null);
  useScrollLock(!!selectedDetail);

  // Helper function to build headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch all project risk assessments on mount
  const fetchAssignedProjects = async () => {
    setLoadingProjects(true);
    setLoadingAnalysis(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/risk/director/all-assessments`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const validList = Array.isArray(data) ? data : [];
        setAssignedProjects(validList);

        const newMap = {};
        validList.forEach((item) => {
          newMap[item.projectId] = item;
        });
        setRiskRecordsMap(newMap);

        if (validList.length > 0) {
          const firstProjId = String(
            validList[0].projectId || validList[0].id || "",
          );
          setSelectedProjectId(firstProjId);
        }
      } else {
        setAssignedProjects([]);
      }
    } catch (err) {
      console.error("Error fetching assigned projects:", err);
      setAssignedProjects([]);
    } finally {
      setLoadingProjects(false);
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchAssignedProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch/Analyze project risk whenever selectedProjectId changes
  const fetchRiskAnalysisForProject = async (projectId) => {
    if (riskRecordsMap[projectId]) return;

    setLoadingAnalysis(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/risk/${projectId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const analysisData = await response.json();
        setRiskRecordsMap((prev) => ({
          ...prev,
          [projectId]: analysisData,
        }));
      }
    } catch (err) {
      console.error(`Error analyzing project #${projectId}:`, err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchRiskAnalysisForProject(selectedProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // 3. Active analysis record based on dropdown selection
  const activeRecord = useMemo(() => {
    if (!selectedProjectId) return null;
    return riskRecordsMap[selectedProjectId] || null;
  }, [selectedProjectId, riskRecordsMap]);

  // Combined list of loaded risk records (Overall status of ALL projects)
  const allLoadedRecords = useMemo(() => {
    return Object.values(riskRecordsMap);
  }, [riskRecordsMap]);

  // Metrics summary calculated from fetched analyses
  const metrics = useMemo(
    () => ({
      total: assignedProjects.length,
      high: allLoadedRecords.filter((i) => i.riskLevel === "HIGH").length,
      medium: allLoadedRecords.filter((i) => i.riskLevel === "MEDIUM").length,
      low: allLoadedRecords.filter((i) => i.riskLevel === "LOW").length,
    }),
    [assignedProjects, allLoadedRecords],
  );

  // Search & Filter Logic for Table
  const filteredTableData = useMemo(() => {
    return allLoadedRecords.filter((item) => {
      const pName = item.projectName || item.project?.projectName || "";
      const matchesSearch = pName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRisk =
        selectedFilter === "ALL" || item.riskLevel === selectedFilter;
      return matchesSearch && matchesRisk;
    });
  }, [allLoadedRecords, searchQuery, selectedFilter]);

  // Details & Recommendations Calculation
  const getCalculatedDetails = (record) => {
    if (!record) return {};

    const projectName =
      record.projectName || record.project?.projectName || "N/A";
    const startDate =
      record.startDate || record.project?.startDate || "Not Specified";
    const targetDate =
      record.targetDate || record.project?.targetDate || "Not Specified";

    const targetDays =
      Number(record.businessTargetDuration ?? record.targetDuration) || 0;
    const expectedDays = Number(record.expectedDuration) || 0;
    const diffDays = parseFloat((expectedDays - targetDays).toFixed(1));
    const probability = Number(record.completionProbability) || 0;
    const riskLevel = record.riskLevel || "NOT_CALCULATED";

    let recommendations;
    if (riskLevel === "NOT_CALCULATED") {
      recommendations = [
        "No PERT risk calculation has been saved for this project yet.",
        "Recommendation: Go to PERT Analysis in the sidebar to enter time estimates and generate risk metrics.",
      ];
    } else if (diffDays > 0) {
      recommendations = [
        `The estimated duration exceeds the planned schedule by ${diffDays} days.`,
        `There is only a ${probability.toFixed(0)}% probability of completing within the planned deadline.`,
        "Recommendation: Revise activity estimates or allocate additional resources.",
      ];
    } else {
      recommendations = [
        `Project is on track with a schedule buffer of ${Math.abs(diffDays)} days.`,
        `High probability (${probability.toFixed(0)}%) of completing within the planned deadline.`,
        "Recommendation: Maintain current resource allocation.",
      ];
    }

    const variance = Number(record.variance) || 0;
    const standardDeviation = Number(record.standardDeviation) || 0;
    const zScore = Number(record.zScore) || 0;
    const explanation = record.explanation || `PERT Z-Score formula Z = (${targetDays} - ${expectedDays}) / ${standardDeviation} yields completion probability of ${probability}%.`;

    return {
      projectName,
      startDate,
      targetDate,
      targetDays,
      expectedDays,
      diffDays,
      variance,
      standardDeviation,
      zScore,
      probability,
      riskLevel,
      explanation,
      recommendations,
    };
  };

  const activeCalc = useMemo(
    () => getCalculatedDetails(activeRecord),
    [activeRecord],
  );

  // What-If Simulation
  const handleWhatIfCalculate = () => {
    if (!whatIfTarget || !activeRecord) return;

    const customTarget = parseFloat(whatIfTarget);
    const expected = activeCalc.expectedDays;
    const variance = Number(activeRecord.variance) || 2.25;
    const stdDev =
      Number(activeRecord.standardDeviation) || Math.sqrt(variance) || 1.5;

    const zScore = (customTarget - expected) / stdDev;

    const erf = (x) => {
      const sign = x < 0 ? -1 : 1;
      const a = Math.abs(x);
      const t = 1.0 / (1.0 + 0.3275911 * a);
      const y =
        1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
          0.284496736) *
          t +
          0.254829592) *
          t *
          Math.exp(-a * a);
      return sign * y;
    };

    const prob = parseFloat(
      (0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100).toFixed(2),
    );

    let level = "LOW";
    if (prob < 50) level = "HIGH";
    else if (prob < 80) level = "MEDIUM";

    setWhatIfResult({
      customTarget,
      prob,
      level,
    });
  };

  /* ── Metric cards config (clickable filters) ───────────────────── */
  const metricCards = [
    {
      key: "ALL",
      label: "My Projects",
      value: metrics.total,
      grad: "from-sky-500 to-blue-600",
      glow: "shadow-sky-200/60",
      ring: "ring-sky-300",
      icon: <FaTasks />,
    },
    {
      key: "HIGH",
      label: "High Risk",
      value: metrics.high,
      grad: "from-rose-400 to-pink-500",
      glow: "shadow-rose-200/60",
      ring: "ring-rose-300",
      icon: <FaExclamationTriangle />,
    },
    {
      key: "MEDIUM",
      label: "Medium Risk",
      value: metrics.medium,
      grad: "from-amber-400 to-orange-500",
      glow: "shadow-amber-200/60",
      ring: "ring-amber-300",
      icon: <FaExclamationTriangle />,
    },
    {
      key: "LOW",
      label: "Low Risk",
      value: metrics.low,
      grad: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-200/60",
      ring: "ring-emerald-300",
      icon: <FaCheckCircle />,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ═══════════ 1. HEADER + PROJECT SELECTOR ═══════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200/70">
            <FaShieldAlt size={22} />
          </div> */}
          <div>
            {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              Risk Intelligence Module
            </span> */}
            <h1 className="mt-1.5 text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              Risk <span className="gradient-text">Assessment</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
                 Select your assigned project to evaluate business-deadline
              completion risk.
            </p>
          </div>
        </div>

        {/* Project selector & Export Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="relative">
            <FaProjectDiagram className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-sky-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setWhatIfResult(null);
                setWhatIfTarget("");
              }}
              disabled={loadingProjects || assignedProjects.length === 0}
              className="glass min-w-60 appearance-none rounded-2xl py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loadingProjects ? (
                <option value="">Loading assigned projects...</option>
              ) : assignedProjects.length > 0 ? (
                assignedProjects.map((item, idx) => {
                  const pId = String(item.projectId || item.id || idx);
                  const pName =
                    item.projectName || item.name || `Project #${pId}`;
                  return (
                    <option key={`proj-opt-${pId}-${idx}`} value={pId}>
                      {pName}
                    </option>
                  );
                })
              ) : (
                <option value="">No Projects Found</option>
              )}
            </select>
            <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          </div>
        </div>
      </div>

      {/* ═══════════ 2. METRIC SUMMARY CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((c) => {
          const active = selectedFilter === c.key;

          return (
            <div
              key={c.key}
              onClick={() => setSelectedFilter(c.key)}
              className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          border
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl

          ${
            active
              ? `bg-white border-transparent ring-2 ${c.ring} shadow-lg`
              : "bg-white border-slate-200 shadow-sm hover:border-cyan-300"
          }

          px-4 py-3
        `}
            >
              {/* Soft Glow */}
              <div
                className={`
            absolute -top-8 -right-8 w-20 h-20
            rounded-full
            bg-linear-to-br ${c.grad}
            blur-3xl opacity-15
          `}
              />

              <div className="relative flex items-center justify-between">
                {/* Left Content */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {c.label}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {c.value}
                  </h2>

                  <p className="text-[10px] text-slate-400">
                    {c.key === "ALL" ? "Assigned" : "Projects"}
                  </p>
                </div>

                {/* Small Icon */}
                <div
                  className={`
              w-10 h-10
              rounded-xl
              bg-linear-to-br ${c.grad}
              flex items-center justify-center
              text-white
              shadow-md
            `}
                >
                  <span className="text-lg">{c.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════ 3. ACTIVE ASSESSMENT DETAILS ═══════════ */}
      {loadingAnalysis ? (
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-300 border-t-sky-600" />
          <p className="text-sm font-semibold text-slate-500">
            Analyzing risk metrics for Project #{selectedProjectId}…
          </p>
        </div>
      ) : activeRecord ? (
        <div className="glass space-y-6 rounded-3xl p-6 lg:p-8">
          {/* Card header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-5">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                <FaProjectDiagram />
              </span>
              Active Assessment Details
            </h3>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold ${riskPill(activeCalc.riskLevel)}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${riskDot(activeCalc.riskLevel)} ${
                  activeCalc.riskLevel !== "NOT_CALCULATED"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              RISK LEVEL: {activeCalc.riskLevel}
            </span>
          </div>

          {/* Balanced 2-column details grid */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 rounded-2xl border border-slate-200/70 p-6 md:grid-cols-2">
            <DetailRow label="Project Name" value={activeCalc.projectName} />
            <DetailRow label="Start Date" value={activeCalc.startDate} />
            <DetailRow label="Target Date" value={activeCalc.targetDate} />
            <DetailRow
              label="Business Target Duration"
              value={`${activeCalc.targetDays} Days`}
              accent="text-sky-600"
            />
            <DetailRow
              label="PERT Estimated Duration"
              value={`${activeCalc.expectedDays} Days`}
            />
            <DetailRow
              label="Project Variance"
              value={`${activeCalc.variance}`}
              accent="text-blue-600"
            />
            <DetailRow
              label="Standard Deviation (σ)"
              value={`${activeCalc.standardDeviation}`}
              accent="text-blue-600"
            />
            <DetailRow
              label="Z-Score"
              value={`${activeCalc.zScore}`}
              accent="text-sky-600"
            />
            <DetailRow
              label="Completion Probability"
              value={`${activeCalc.probability}%`}
              accent="text-sky-600"
            />
            <DetailRow
              label="Risk Level"
              value={activeCalc.riskLevel}
              accent={
                activeCalc.riskLevel === "HIGH"
                  ? "text-rose-600"
                  : activeCalc.riskLevel === "MEDIUM"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            />
          </div>

          {/* PERT Methodology Calculation Explanation */}
          <div className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-sky-50 to-blue-50/60 p-5">
            <h4 className="mb-2 flex items-center gap-2.5 text-sm font-black text-sky-900">
              <FaCalculator className="text-sky-600" /> PERT Methodology Probability Calculation
            </h4>
            <p className="text-xs font-medium leading-relaxed text-sky-950">
              {activeCalc.explanation}
            </p>
          </div>

          {/* Project Manager Recommendations */}
          <div className="rounded-2xl border border-amber-200/70 bg-linear-to-br from-amber-50 to-orange-50/50 p-6">
            <h4 className="mb-4 flex items-center gap-3 text-base font-black text-amber-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-600">
                <FaLightbulb size={16} />
              </span>
              Project Manager Recommendations
            </h4>
            <ul className="space-y-2.5">
              {activeCalc.recommendations?.map((rec, idx) => (
                <li
                  key={`rec-${idx}`}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-amber-800/90"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* What-If Analysis */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6">
            <h4 className="mb-4 flex flex-wrap items-center gap-3 text-base font-black text-slate-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-100 text-sky-600">
                <FaCalculator size={16} />
              </span>
              What-If Analysis
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Test alternative business deadlines
              </span>
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <FaChartLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-300" />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Test Deadline (e.g. 35 Days)"
                  value={whatIfTarget}
                  onInput={handleNumberInput}
                  onKeyDown={blockInvalidNumberKeys}
                  onChange={(e) => setWhatIfTarget(e.target.value)}
                  className="glass-input w-72 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-300"
                />
              </div>
              <button
                onClick={handleWhatIfCalculate}
                className="btn-shine rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sky-300"
              >
                Simulate
              </button>
            </div>

            {whatIfResult && (
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-sky-200/70 p-4 text-sm text-slate-600">
                <span>
                  Tested Deadline:{" "}
                  <strong className="font-bold text-slate-900">
                    {whatIfResult.customTarget} Days
                  </strong>
                </span>
                <span>
                  Expected:{" "}
                  <strong className="font-bold text-slate-900">
                    {activeCalc.expectedDays} Days
                  </strong>
                </span>
                <span>
                  Probability:{" "}
                  <strong className="font-bold text-sky-600">
                    {whatIfResult.prob}%
                  </strong>
                </span>
                <span className="inline-flex items-center gap-2">
                  Simulated Risk:
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${riskPill(whatIfResult.level)}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${riskDot(whatIfResult.level)}`}
                    />
                    {whatIfResult.level}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
            <FaChartLine size={22} />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Select a project above to run the analysis.
          </p>
        </div>
      )}

      {/* ═══════════ 4. ANALYZED PROJECTS RECORDS TABLE ═══════════ */}
      <div className="glass overflow-hidden rounded-3xl">
        {/* Table header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <FaDatabase />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Analyzed Projects Records
              </h3>
              <p className="text-xs font-medium text-slate-400">
                {filteredTableData.length} of {allLoadedRecords.length} records
                {selectedFilter !== "ALL"
                  ? ` · ${selectedFilter} risk only`
                  : ""}
              </p>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-300" />
            <input
              type="text"
              placeholder="Search table…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-64 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
          <table className="w-full text-sm">
            <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
              <tr className="text-left">
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Expected (Days)</th>
                <th className="px-6 py-4">Target (Days)</th>
                <th className="px-6 py-4">Variance</th>
                <th className="px-6 py-4">Probability</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filteredTableData.length > 0 ? (
                filteredTableData.map((row, index) => {
                  const pId = String(
                    row.projectId || row.project?.projectId || index,
                  );
                  const pName =
                    row.projectName ||
                    row.project?.projectName ||
                    `Project #${pId}`;
                  const rowKey = row.projectId
                    ? `risk-${row.projectId}`
                    : `proj-row-${pId}-${index}`;
                  const targetDays =
                    row.businessTargetDuration ?? row.targetDuration;
                  const level = String(row.riskLevel || "NOT_CALCULATED");

                  return (
                    <tr
                      key={rowKey}
                      className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {pName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {row.expectedDuration}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{targetDays}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {row.variance}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {Number(row.completionProbability).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${riskPill(level)}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${riskDot(level)} ${
                              level !== "NOT_CALCULATED" ? "animate-pulse" : ""
                            }`}
                          />
                          {row.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedProjectId(pId);
                            setSelectedDetail(row);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-bold text-sky-600 transition-all duration-200 cursor-pointer hover:border-sky-300 hover:bg-sky-100"
                        >
                          <FaEye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FaDatabase size={22} />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">
                        No risk analysis records found.
                      </p>
                      <p className="text-xs text-slate-400">
                        Select a project above to run the analysis.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════ 5. VIEW DETAILS MODAL ═══════════ */}
      {selectedDetail && (
        <div
          className="modal-backdrop fixed inset-0 z-60 flex overflow-y-auto p-4 backdrop-blur-xs"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="glass-strong m-auto w-full max-w-lg space-y-5 rounded-3xl p-6 max-h-[90vh] overflow-y-auto lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
              <h3 className="flex items-center gap-2.5 text-base font-black text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-100 text-sky-600">
                  <FaDatabase size={14} />
                </span>
                Full Project Payload Details
              </h3>
              <button
                onClick={() => setSelectedDetail(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition cursor-pointer hover:bg-rose-50 hover:text-rose-500"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Details grid */}
            <div className="space-y-3 rounded-xl border border-slate-300/70 bg-white p-5 text-sm">
              {[
                ["Project ID", `#${selectedDetail.projectId}`],
                ["Project Name", selectedDetail.projectName],
                ["Start Date", selectedDetail.startDate],
                ["Target Date", selectedDetail.targetDate],
                [
                  "Expected Duration",
                  `${selectedDetail.expectedDuration} Days`,
                ],
                [
                  "Business Target Duration",
                  `${selectedDetail.businessTargetDuration} Days`,
                ],
                ["Variance", selectedDetail.variance],
                ["Standard Deviation", selectedDetail.standardDeviation],
                ["Z-Score", selectedDetail.zScore],
                [
                  "Completion Probability",
                  `${selectedDetail.completionProbability}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="font-medium text-slate-500">{label}</span>
                  <strong className="text-right font-bold text-slate-900">
                    {value}
                  </strong>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="font-medium text-slate-500">Risk Level</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${riskPill(selectedDetail.riskLevel)}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${riskDot(selectedDetail.riskLevel)}`}
                  />
                  {selectedDetail.riskLevel}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDetail(null)}
              className="btn-shine w-full rounded-2xl bg-linear-to-r from-slate-700 to-slate-900 py-3 text-sm font-bold text-white transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
