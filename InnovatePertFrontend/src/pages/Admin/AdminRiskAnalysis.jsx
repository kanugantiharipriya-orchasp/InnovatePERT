import { useState, useEffect, useMemo } from "react";
import useScrollLock from "../../utils/useScrollLock";
import AdminSidebar from "./AdminSidebar";
import {
  FaExclamationTriangle, FaCheckCircle, FaList,
  FaEye, FaSearch, FaTimes, FaShieldAlt,
  FaChartLine, FaCalendarAlt, FaUser,
  FaChevronLeft, FaChevronRight, FaTimesCircle,
  FaBars,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const PAGE_SIZE = 5;

// ── Risk config — light pastel palette, each level visually distinct ────────
const RISK = {
  VERY_HIGH: {
    label: "Very High",
    pill: "bg-red-50 text-red-700 border-red-200/80",
    dot: "bg-red-500",
    gradient: "from-red-500 to-rose-700",
    valueColor: "text-red-700",
    ring: "ring-red-300",
  },
  HIGH: {
    label: "High",
    pill: "bg-rose-50 text-rose-600 border-rose-200/80",
    dot: "bg-rose-500",
    gradient: "from-rose-400 to-red-600",
    valueColor: "text-rose-600",
    ring: "ring-rose-300",
  },
  MEDIUM: {
    label: "Medium",
    pill: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
    gradient: "from-amber-400 to-orange-500",
    valueColor: "text-amber-600",
    ring: "ring-amber-300",
  },
  LOW: {
    label: "Low",
    pill: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
    dot: "bg-emerald-500",
    gradient: "from-emerald-400 to-green-600",
    valueColor: "text-emerald-600",
    ring: "ring-emerald-300",
  },
  UNKNOWN: {
    label: "Unknown",
    pill: "bg-slate-100 text-slate-500 border-slate-200/80",
    dot: "bg-slate-400",
    gradient: "from-slate-400 to-slate-600",
    valueColor: "text-slate-600",
    ring: "ring-slate-300",
  },
};

const riskCfg = (level) => RISK[String(level).toUpperCase()] ?? RISK.UNKNOWN;

const getRecommendation = (level) => {
  const l = String(level).toUpperCase();
  if (l === "VERY_HIGH" || l === "HIGH")
    return "Critical schedule variance detected. Immediately crash critical path activities and escalate to the R&D Director.";
  if (l === "MEDIUM")
    return "Moderate variance observed. Monitor slack time closely and review resource allocation weekly.";
  return "Project timeline is healthy. Continue standard monitoring cadence.";
};

/* KPI card — same style & layout as the Admin Dashboard summary cards */
function StatCard({ label, value, icon, filter, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-4 w-full text-left
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-lg hover:shadow-2xl hover:-translate-y-1
        transition-all duration-300
        p-4 min-h-22.5
        cursor-pointer
        ${active
          ? `ring-2 ${filter?.ring ?? "ring-slate-300"} border-transparent`
          : "border-slate-200"}
      `}
    >
      {/* Icon tile */}
      <div
        className={`
          w-10 h-10 shrink-0
          rounded-2xl
          bg-linear-to-br ${filter?.gradient ?? "from-slate-400 to-slate-600"}
          flex items-center justify-center
          text-white
          shadow-lg
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${filter?.valueColor ?? "text-slate-700"}`}>
          {value}
        </p>
      </div>
    </button>
  );
}

/* Light pastel risk pill — distinct color per level */
function RiskBadge({ level }) {
  const c = riskCfg(level);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${c.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function AdminRiskAnalysis() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedManager, setSelectedManager] = useState("ALL");
  const [activeRiskFilter, setActiveRiskFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspected, setInspected]     = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen]               = useState(true);

  useScrollLock(!!inspected);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/risk/director/all-assessments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setProjects(
          (data || []).map((item) => ({
            id:           item.projectId,
            projectName:  item.projectName  ?? "N/A",
            managerName:  item.managerName  ?? "Unassigned",
            startDate:    item.startDate    ?? "N/A",
            targetDate:   item.targetDate   ?? "N/A",
            targetDays:   item.businessTargetDuration  ?? 0,
            expectedDays: item.expectedDuration        ?? 0,
            variance:     item.variance     ?? 0,
            probability:  item.completionProbability   ?? 0,
            riskLevel:    (item.riskLevel ?? "UNKNOWN").toUpperCase(),
          }))
        );
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load risk assessment data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const managerList = useMemo(() => {
    const unique = [...new Set(projects.map((p) => p.managerName))].filter(Boolean);
    return ["ALL", ...unique];
  }, [projects]);

  const base = useMemo(() =>
    selectedManager === "ALL" ? projects : projects.filter((p) => p.managerName === selectedManager),
    [projects, selectedManager]);

  const filtered = useMemo(() =>
    base.filter((p) => {
      const matchRisk = activeRiskFilter === "ALL" || p.riskLevel === activeRiskFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || (p.projectName ?? "").toLowerCase().includes(q)
        || (p.managerName ?? "").toLowerCase().includes(q)
        || String(p.id ?? "").includes(q);
      return matchRisk && matchSearch;
    }),
    [base, activeRiskFilter, searchQuery]);

  const count = (level) =>
    base.filter((p) => p.riskLevel === level.toUpperCase()).length;

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const selectRiskFilter = (level) => {
    setActiveRiskFilter(level);
    setCurrentPage(1);
  };

  return (
    <div className="relative bg-white flex min-h-screen">
      <AdminSidebar open={open} setOpen={setOpen} />
      <main
        style={{ "--sidebar-w": open ? "16rem" : "5rem" }}
        className={`relative z-10 flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${open ? "lg:ml-64" : "lg:ml-20"}`}
      >
        <div key="risk-analysis">
        <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 border border-slate-200 shadow-sm lg:hidden hover:text-sky-600 hover:bg-slate-50"
        >
          <FaBars size={18} />
        </button>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Risk Assessment{" "}
          <span className="bg-linear-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
            Summary
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time monitoring of project risk metrics across all managers.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl
          border border-slate-200 bg-white shadow-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-400 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading assessments…</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* ── KPI Cards — Dashboard style ── */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatCard label="Total Projects"  value={base.length}   icon={<FaList size={15} />}
              filter={{ gradient: "from-cyan-400 to-blue-600", valueColor: "text-cyan-600", ring: "ring-cyan-300" }}
              active={activeRiskFilter === "ALL"} onClick={() => selectRiskFilter("ALL")} />
            <StatCard label="High Risk"       value={count("HIGH")} icon={<FaExclamationTriangle size={15} />}
              filter={RISK.HIGH}
              active={activeRiskFilter === "HIGH"} onClick={() => selectRiskFilter("HIGH")} />
            <StatCard label="Medium Risk"     value={count("MEDIUM")} icon={<FaExclamationTriangle size={15} />}
              filter={RISK.MEDIUM}
              active={activeRiskFilter === "MEDIUM"} onClick={() => selectRiskFilter("MEDIUM")} />
            <StatCard label="Low Risk"        value={count("LOW")}  icon={<FaCheckCircle size={15} />}
              filter={RISK.LOW}
              active={activeRiskFilter === "LOW"} onClick={() => selectRiskFilter("LOW")} />
          </div>

          {/* ── Table ── */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">

            {/* Table header */}
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-800">Analyzed Projects</p>
                <p className="text-xs text-slate-400">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {activeRiskFilter !== "ALL" ? ` · ${riskCfg(activeRiskFilter).label} risk` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Manager filter */}
                <select
                  value={selectedManager}
                  onChange={(e) => {
                    setSelectedManager(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  {managerList.map((m) => (
                    <option key={m} value={m}>{m === "ALL" ? "All Managers" : m}</option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search project or manager…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 py-2 pl-8 pr-4 text-sm text-slate-700 w-56 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
              <table className="w-full min-w-200 text-sm [&_thead_th]:bg-[linear-gradient(92deg,#f8fafc,#f1f5f9)] [&_thead_th]:text-slate-500 [&_thead_th]:uppercase [&_thead_th]:tracking-wider [&_thead_th]:text-[10px]">                <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
                   <tr className="text-left">
                    {["Project Name","Manager","Expected","Target","Probability","Risk","Action"].map((h) => (
                      <th key={h} className="px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                        No records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p, i) => (
                      <tr key={p.id ?? i}
                        className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]">
                        <td className="px-6 py-4 font-semibold text-slate-800">{p.projectName}</td>
                        <td className="px-6 py-4 text-slate-600">{p.managerName}</td>
                        <td className="px-6 py-4 text-slate-600">{p.expectedDays}d</td>
                        <td className="px-6 py-4 text-slate-600">{p.targetDays}d</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-blue-400 to-blue-500"
                                style={{ width: `${Math.min(Number(p.probability), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{p.probability}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={p.riskLevel} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setInspected(p)}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold
                              text-white shadow-sm shadow-blue-200 transition cursor-pointer
                              hover:bg-blue-700"
                          >
                            <FaEye size={11} />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                <p className="text-xs font-medium text-slate-500">
                  Showing {startIdx + 1}–{endIdx} of {filtered.length} records
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500
                      transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    title="Previous"
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      aria-current={n === safePage ? "page" : undefined}
                      className={`h-8 min-w-8 rounded-xl px-2 text-xs font-bold transition cursor-pointer
                        ${
                          n === safePage
                            ? "bg-linear-to-r from-rose-500 to-orange-400 text-white shadow-md shadow-rose-200"
                            : "border border-slate-200 text-slate-600 hover:bg-white"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500
                      transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    title="Next"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Inspect Modal — blurred background, all risk details ── */}
      {inspected && (
        <div
          className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-slate-700/18 backdrop-blur-[6px]"
          onClick={() => setInspected(null)}
        >
          <div
            className="m-auto w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)] lg:translate-x-[calc(var(--sidebar-w,16rem)/4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl
                  bg-linear-to-br from-rose-500 to-orange-400 text-white shadow-md">
                  <FaShieldAlt size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Risk Inspection</p>
                  <p className="text-xs text-slate-400">{inspected.projectName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={inspected.riskLevel} />
                <button onClick={() => setInspected(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl
                    text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer">
                  <FaTimes size={14} />
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-px bg-slate-100/80 md:grid-cols-4">
              {[
                { icon: <FaUser className="text-blue-500" />,       label: "Project Manager",    value: inspected.managerName },
                { icon: <FaCalendarAlt className="text-sky-500" />,   label: "Start Date",         value: inspected.startDate },
                { icon: <FaCalendarAlt className="text-sky-500" />,label: "Target Date",        value: inspected.targetDate },
                { icon: <FaChartLine className="text-cyan-500" />,    label: "Completion Prob.",   value: `${inspected.probability}%` },
                { icon: <FaList className="text-slate-500" />,        label: "Target Duration",    value: `${inspected.targetDays} days` },
                { icon: <FaList className="text-blue-500" />,         label: "Expected Duration",  value: `${inspected.expectedDays} days` },
                {
                  icon: <FaChartLine className={Number(inspected.variance) > 0 ? "text-rose-500" : "text-emerald-500"} />,
                  label: "Variance",
                  value: inspected.variance,
                  valueClass: Number(inspected.variance) > 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black",
                },
                { icon: <FaShieldAlt className="text-orange-500" />,  label: "Risk Level",         value: <RiskBadge level={inspected.riskLevel} /> },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                    <p className={`mt-0.5 text-sm font-semibold text-slate-800 ${f.valueClass ?? ""}`}>{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="border-t border-slate-100 bg-linear-to-r from-blue-50 to-blue-50/50 px-6 py-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">Recommendation</p>
              <p className="text-sm leading-relaxed text-slate-700">
                {getRecommendation(inspected.riskLevel)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
      </div>
      </main>
    </div>
  );
}
