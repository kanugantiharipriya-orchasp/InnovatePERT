import { useState, useEffect, useCallback } from "react";
import { reportService } from "../../services/reportService";
import {
  FaFilePdf,
  FaFileExcel,
  FaSpinner,
  FaFolderOpen,
  FaChartBar,
  FaChevronDown,
  FaTasks,
  FaEye,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCalculator,
  FaCheckCircle,
  FaExclamationCircle,
  FaBolt,
} from "react-icons/fa";

function ManagerReports() {
  const [activeReportType, setActiveReportType] = useState("menu");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [riskReportData, setRiskReportData] = useState(null);
  const [crashingReportData, setCrashingReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportType, setExportType] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await reportService.getProjects());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const resetSelection = () => {
    setSelectedProjectId("");
    setRiskReportData(null);
    setCrashingReportData(null);
    if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
    setPreviewPdfUrl(null);
  };

  const handleReportTypeChange = (type) => {
    resetSelection();
    setActiveReportType(type);
    if (
      (type === "complete" || type === "risk" || type === "crashing") &&
      projects?.length > 0
    ) {
      const fid = String(projects[0].projectId);
      setSelectedProjectId(fid);
      if (type === "complete")
        loadPreview(fid, reportService.downloadCompleteProjectReport);
      else if (type === "risk")
        loadPreview(fid, reportService.downloadRiskAssessmentReport, true);
      else if (type === "crashing")
        loadPreview(fid, reportService.downloadCrashingReport, false, true);
    }
  };

  const handleProjectSelect = async (pid) => {
    setSelectedProjectId(pid);
    if (!pid) {
      resetSelection();
      return;
    }
    if (activeReportType === "complete")
      loadPreview(pid, reportService.downloadCompleteProjectReport);
    else if (activeReportType === "risk")
      loadPreview(pid, reportService.downloadRiskAssessmentReport, true);
    else if (activeReportType === "crashing")
      loadPreview(pid, reportService.downloadCrashingReport, false, true);
  };

  const loadPreview = async (pid, fn, risk = false, crash = false) => {
    setPreviewLoading(true);
    try {
      const d = await fn(pid, "pdf");
      const b = new Blob([d], { type: "application/pdf" });
      setPreviewPdfUrl(window.URL.createObjectURL(b));
      if (risk) setRiskReportData(true);
      if (crash) setCrashingReportData(true);
    } catch {
      setPreviewPdfUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (fmt, fn, label) => {
    if (!selectedProjectId) return;
    setDownloading(true);
    setExportType(fmt);
    try {
      const d = await fn(selectedProjectId, fmt);
      const mime =
        fmt === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const ext = fmt === "excel" ? "xlsx" : "pdf";
      const b = new Blob([d], { type: mime });
      const url = window.URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `${label}_proj_${selectedProjectId}.${ext}`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download " + label + ".");
    } finally {
      setDownloading(false);
      setExportType("");
    }
  };

  const reportLabels = {
    complete: "Complete Project Report",
    risk: "Risk Assessment Report",
    crashing: "Project Crashing Report",
  };
  const reportFns = {
    complete: reportService.downloadCompleteProjectReport,
    risk: reportService.downloadRiskAssessmentReport,
    crashing: reportService.downloadCrashingReport,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {/* <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Project Manager Executive Suite
            </span> */}
          </div>
          <h1 className="mt-1.5 text-2xl lg:text-3xl font-black tracking-tight text-slate-800">
            Project Reports &{" "}
            <span className="bg-linear-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeReportType === "menu"
              ? "Generate, preview, and export analytical reports."
              : activeReportType === "complete"
                ? "Configuring Complete Project Report"
                : activeReportType === "risk"
                  ? "Configuring Risk Assessment Report"
                  : "Configuring Project Crashing Report"}
          </p>
        </div>
        {activeReportType !== "menu" && (
          <button
            onClick={() => handleReportTypeChange("menu")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer self-start"
          >
            <FaArrowLeft size={10} /> Back to Reports Hub
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Available Modules",
            value: "3 Active Suites",
            icon: <FaFolderOpen />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Export Formats",
            value: "PDF & XLSX",
            icon: <FaChartBar />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Access Control",
            value: "Project Manager",
            icon: <FaTasks />,
            color: "bg-blue-50 text-blue-600",
          },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {c.label}
              </p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {c.value}
              </h3>
            </div>
            <div
              className={
                "h-10 w-10 rounded-xl " +
                c.color +
                " flex items-center justify-center text-base"
              }
            >
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {activeReportType === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Complete Project Report",
              desc: "Deep-dive analytical reporting suite with full project milestone schedules, PERT calculations, and budget metrics.",
              type: "complete",
              icon: <FaFolderOpen />,
              color: "bg-blue-600",
              badge: "Jasper Multi-Format",
              badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
            },
            {
              title: "Risk Assessment Report",
              desc: "Schedule risk analysis evaluating PERT expected duration, variance, Z-score, and completion probability.",
              type: "risk",
              icon: <FaExclamationTriangle />,
              color: "bg-amber-500",
              badge: "PERT Risk",
              badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
            },
            {
              title: "Project Crashing Report",
              desc: "Schedule compression and cost optimization report with crashable activity costs and cost slopes.",
              type: "crashing",
              icon: <FaBolt />,
              color: "bg-blue-600",
              badge: "Cost Suite",
              badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
            },
          ].map((card) => (
            <div
              key={card.type}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={
                      "h-10 w-10 rounded-xl " +
                      card.color +
                      " text-white flex items-center justify-center text-base"
                    }
                  >
                    {card.icon}
                  </div>
                  <span
                    className={
                      "inline-flex items-center border rounded-full px-2 py-0.5 text-[10px] font-bold " +
                      card.badgeCls
                    }
                  >
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => handleReportTypeChange(card.type)}
                  className="w-full py-2.5 bg-slate-100  text-black text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FaEye /> Select &amp; Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {["complete", "risk", "crashing"].map(
        (type) =>
          activeReportType === type && (
            <div key={type} className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {type === "complete"
                      ? "Select Project for Report"
                      : type === "risk"
                        ? "Select Project for Risk Analysis"
                        : "Select Project for Crashing Report"}
                  </label>
                  <span
                    className={
                      "text-[10px] border px-2 py-0.5 rounded-full font-bold " +
                      (type === "risk"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200")
                    }
                  >
                    {type === "risk" ? "PERT Active" : "Engine Ready"}
                  </span>
                </div>
                {loading ? (
                  <div className="text-xs text-slate-500 py-3 flex items-center gap-2">
                    <FaSpinner className="animate-spin text-blue-600" />{" "}
                    Loading...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-800 cursor-pointer appearance-none pr-10"
                    >
                      <option value="">-- Choose a project --</option>
                      {projects.map((p) => (
                        <option key={p.projectId} value={p.projectId}>
                          {p.projectName} (ID: #{p.projectId})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <FaChevronDown size={10} />
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {reportLabels[type]}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Generated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    InnovatePERT
                  </p>
                </div>
                <div
                  className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200"
                  style={{ height: "65vh", minHeight: "500px" }}
                >
                  {previewLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                    </div>
                  ) : previewPdfUrl ? (
                    <iframe
                      src={previewPdfUrl}
                      className="w-full h-full border-0"
                      title="Report PDF"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">
                      Select a project to load the report.
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() =>
                      handleDownload("pdf", reportFns[type], type + "_report")
                    }
                    disabled={downloading}
                    className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  >
                    {downloading && exportType === "pdf" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaFilePdf />
                    )}{" "}
                    PDF
                  </button>
                  <button
                    onClick={() =>
                      handleDownload("excel", reportFns[type], type + "_report")
                    }
                    disabled={downloading}
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  >
                    {downloading && exportType === "excel" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaFileExcel />
                    )}{" "}
                    Excel
                  </button>
                </div>
              </div>
            </div>
          ),
      )}
    </div>
  );
}

export default ManagerReports;
