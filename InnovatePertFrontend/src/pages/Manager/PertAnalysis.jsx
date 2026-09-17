import { useState, useEffect, useMemo } from "react";
import {
  RotateCw,
  Search,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Activity,
  FolderKanban,
  BarChart3,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import { projectService } from "../../services/projectService";
import pertService from "../../services/pertService";

export default function PertAnalysis() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [pertList, setPertList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch project list on component mount
  useEffect(() => {
    const fetchProjectsList = async () => {
      setLoadingProjects(true);
      try {
        const projectData = await projectService.getAllProjects();
        const list = Array.isArray(projectData) ? projectData : [];
        setProjects(list);

        if (list.length > 0) {
          const firstId = list[0].id || list[0].projectId;
          setSelectedProjectId(firstId);
        }
      } catch (err) {
        setErrorMessage(
          err.message || "Failed to load project list from backend."
        );
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjectsList();
  }, []);

  // 2. Fetch PERT results
  const fetchPertResults = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await pertService.getPertResultsByProject(selectedProjectId);
      setPertList(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load PERT results.");
      setPertList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchPertResults();
    }
  }, [selectedProjectId]);

  // 3. Recalculate handler
  const handleCalculatePert = async () => {
    if (!selectedProjectId) return;

    setIsCalculating(true);
    setErrorMessage("");

    try {
      await pertService.generatePertAnalysis(selectedProjectId);
      await fetchPertResults();
    } catch (err) {
      setErrorMessage(err.message || "Failed to calculate PERT results.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let totalTe = 0;
    let totalVar = 0;

    pertList.forEach((item) => {
      const te = item.expectedTime ?? item.expectedDuration ?? item.t_e ?? 0;
      const v = item.variance ?? item.v_e ?? 0;
      totalTe += Number(te);
      totalVar += Number(v);
    });

    const totalStdDev = Math.sqrt(totalVar);

    return {
      totalActivities: pertList.length,
      expectedDuration: totalTe,
      variance: totalVar,
      stdDev: totalStdDev,
    };
  }, [pertList]);

  // Search filter
  const filteredBreakdown = useMemo(() => {
    return pertList.filter((item) => {
      const name = item.activityName ?? item.activityTitle ?? item.name ?? "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [pertList, searchTerm]);

  // Max task duration calculation
  const maxTaskDuration = useMemo(() => {
    if (pertList.length === 0) return 10;
    return Math.max(
      ...pertList.map((item) =>
        Number(item.pessimisticTime ?? item.pessimisticDuration ?? item.pessimistic ?? item.t_p ?? 10)
      )
    );
  }, [pertList]);

  const getRiskBadge = (level) => {
    const l = (level || "low").toLowerCase();
    if (l === "high") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" /> High Risk
        </span>
      );
    }
    if (l === "medium") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> Low Risk
      </span>
    );
  };

  const getTaskRiskLevel = (sd) => {
    if (sd >= 1.5) return "high";
    if (sd >= 0.75) return "medium";
    return "low";
  };

  const metricCards = [
    { id: "activities", label: "Total Activities", value: metrics.totalActivities, icon: <Layers className="w-5 h-5" />, grad: "from-cyan-500 to-blue-600", text: "text-slate-800" },
    { id: "expected", label: <>Expected Time (T<sub>e</sub>)</>, value: <>{Number(metrics.expectedDuration).toFixed(2)} <span className="text-sm font-normal text-slate-400">days</span></>, icon: <Clock className="w-5 h-5" />, grad: "from-sky-500 to-cyan-500", text: "text-cyan-600" },
    { id: "variance", label: "Variance (σ²)", value: Number(metrics.variance).toFixed(2), icon: <span className="text-sm font-black">σ²</span>, grad: "from-blue-500 to-blue-600", text: "text-blue-600" },
    { id: "stddev", label: "Std. Dev (σ)", value: Number(metrics.stdDev).toFixed(2), icon: <Activity className="w-5 h-5" />, grad: "from-sky-500 to-sky-600", text: "text-sky-600" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl
            bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              PERT <span className="gradient-text-cyan">Analysis</span>
            </h1>
            <p className="text-sm text-slate-500">
              Project Evaluation and Review Technique metrics for activities
            </p>
          </div>
          <span className="ml-1 hidden rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 sm:inline-block">
            {metrics.totalActivities} activities
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector Dropdown */}
          <div className="relative flex items-center rounded-2xl border border-slate-200/80
            px-3 py-2 shadow-sm transition
            focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500">
            <FolderKanban className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects || projects.length === 0}
              className="bg-transparent text-sm text-slate-700 font-semibold focus:outline-none cursor-pointer pr-2 disabled:opacity-50"
            >
              {loadingProjects ? (
                <option value="">Loading projects...</option>
              ) : projects.length === 0 ? (
                <option value="">No projects found</option>
              ) : (
                projects.map((proj) => {
                  const id = proj.id || proj.projectId;
                  const name = proj.projectName || proj.name || `Project #${id}`;
                  return (
                    <option key={id} value={id}>
                      {name} (ID: {id})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Recalculate Button */}
          <button
            onClick={handleCalculatePert}
            disabled={isCalculating || loading || !selectedProjectId}
            className="btn-shine flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600
              px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-300/40 transition
              hover:-translate-y-0.5 cursor-pointer disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-4 h-4 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "Calculating..." : "Recalculate PERT"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-600 font-bold text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Top Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div key={m.id} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white
            p-5 transition-transform hover:-translate-y-1">
            {/* <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-linear-to-br ${m.grad} opacity-10`} /> */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                <h3 className={`text-2xl font-extrabold mt-1 ${m.text}`}>{m.value}</h3>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
                bg-linear-to-br ${m.grad} text-white shadow-md`}>
                {m.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Task Time Estimates */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br
                from-cyan-500 to-blue-600 text-white shadow-md">
                <BarChart3 className="w-4 h-4" />
              </span>
              Task Time Estimates
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualizing task completion windows from Best-case to Worst-case
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Best Case
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Expected
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Worst Case
            </span>
          </div>
        </div>

        <div className="space-y-4 max-h-100 overflow-y-auto pr-1">
          {filteredBreakdown.length > 0 ? (
            filteredBreakdown.map((item, idx) => {
              const name = item.activityName ?? item.activityTitle ?? item.name ?? `Task #${item.activityId || idx + 1}`;
              const best = Number(item.optimisticTime ?? item.optimisticDuration ?? item.optimistic ?? item.t_o ?? 0);
              const expected = Number(item.expectedTime ?? item.expectedDuration ?? item.t_e ?? 0);
              const worst = Number(item.pessimisticTime ?? item.pessimisticDuration ?? item.pessimistic ?? item.t_p ?? 0);
              const sd = Number(item.standardDeviation ?? item.stdDev ?? Math.sqrt(item.variance ?? item.v_e ?? 0));

              const bestPct = Math.min((best / maxTaskDuration) * 100, 100);
              const expectedPct = Math.min((expected / maxTaskDuration) * 100, 100);
              const worstPct = Math.min((worst / maxTaskDuration) * 100, 100);

              const taskRisk = getTaskRiskLevel(sd);

              return (
                <div key={idx} className="rounded-2xl border border-slate-100/80 p-4 transition hover:bg-white/90">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{name}</span>
                      {getRiskBadge(taskRisk)}
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      Expected: {expected.toFixed(1)} days
                    </span>
                  </div>

                  <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-rose-300 rounded-full" style={{ width: `${worstPct}%` }}></div>
                    <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: `${expectedPct}%` }}></div>
                    <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full" style={{ width: `${bestPct}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
                    <span className="text-emerald-600">Best: {best}d</span>
                    <span className="text-rose-600">Worst: {worst}d</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tasks available for this project.
            </div>
          )}
        </div>
      </div>

      {/* 4. PERT Terminology Explanation Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br
            from-blue-500 to-blue-600 text-white shadow-md">
            <HelpCircle className="w-4 h-4" />
          </span>
          Understanding PERT Calculation Terms (In Simple Words)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 to-sky-50/60 p-4">
            <h4 className="text-xs font-extrabold uppercase text-cyan-600 tracking-wider">1. Expected Time (Te)</h4>
            <p className="text-xs font-semibold text-slate-700 mt-1">"Realistic Completion Target"</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Calculates the realistic deadline by giving extra weight to the most likely duration.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-blue-50/60 p-4">
            <h4 className="text-xs font-extrabold uppercase text-blue-600 tracking-wider">2. Variance (σ²)</h4>
            <p className="text-xs font-semibold text-slate-700 mt-1">"Uncertainty & Risk Measure"</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Measures the gap between best-case and worst-case estimates. Higher value = higher task risk.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-sky-50/60 p-4">
            <h4 className="text-xs font-extrabold uppercase text-sky-600 tracking-wider">3. Standard Deviation (σ)</h4>
            <p className="text-xs font-semibold text-slate-700 mt-1">"Possible Buffer Days"</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Converts risk into actual days. Shows how many days early or late a task might finish.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Breakdown Table Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br
              from-cyan-500 to-blue-600 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">PERT Calculation Breakdown</h3>
              <p className="text-xs text-slate-400">{filteredBreakdown.length} rows</p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by activity name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-300 transition-all border"
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-white border rounded-3xl border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
              <tr>
                <th className="px-6 py-4">Activity Name</th>
                <th className="px-6 py-4 text-center">Optimistic (T<sub>o</sub>)</th>
                <th className="px-6 py-4 text-center">Most Likely (T<sub>m</sub>)</th>
                <th className="px-6 py-4 text-center">Pessimistic (T<sub>p</sub>)</th>
                <th className="px-6 py-4 text-center">Expected (T<sub>e</sub>)</th>
                <th className="px-6 py-4 text-center">Variance (σ²)</th>
                <th className="px-6 py-4 text-center">Std Dev (σ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((item, idx) => {
                  const name = item.activityName ?? item.activityTitle ?? item.name ?? `Activity #${item.activityId || idx + 1}`;
                  const to = item.optimisticTime ?? item.optimisticDuration ?? item.optimistic ?? 0;
                  const tm = item.mostLikelyTime ?? item.mostLikelyDuration ?? item.mostLikely ?? 0;
                  const tp = item.pessimisticTime ?? item.pessimisticDuration ?? item.pessimistic ?? 0;
                  const te = item.expectedTime ?? item.expectedDuration ?? item.t_e ?? 0;
                  const v = item.variance ?? item.v_e ?? 0;
                  const sd = item.standardDeviation ?? item.stdDev ?? Math.sqrt(v);
                  const actual = item.actualTime ?? item.actualDuration ?? null;

                  return (
                    <tr key={item.id || item.activityId || idx} className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]">
                      <td className="py-4 px-3 font-semibold text-slate-800">{name}</td>
                      <td className="py-4 px-3 text-center">{to} d</td>
                      <td className="py-4 px-3 text-center">{tm} d</td>
                      <td className="py-4 px-3 text-center">{tp} d</td>
                      <td className="py-4 px-3 text-center font-bold text-cyan-600">
                        {Number(te).toFixed(2)} d
                      </td>
                      <td className="py-4 px-3 text-center font-semibold text-blue-600">
                        {Number(v).toFixed(2)}
                      </td>
                      <td className="py-4 px-3 text-center font-semibold text-sky-600">
                        {Number(sd).toFixed(2)}
                      </td>
                      <td className="py-4  text-center">
                        {actual !== null && actual !== undefined ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {actual} d
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Info className="mx-auto w-6 h-6 mb-2 text-slate-300" />
                    No PERT calculations found for selected project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
