import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import TopBar from "../../components/TopBar";
import { reportService } from "../../services/reportService";
import {
  FaFilePdf,
  FaFileExcel,
  FaFileAlt,
  FaSpinner,
  FaArrowLeft,
  FaEye,
  FaFolderOpen,
  FaUserTie,
  FaChartBar,
  FaShieldAlt,
  FaLayerGroup,
  FaChevronDown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

function AdminReports() {
  const [open, setOpen] = useState(true);

  const [activeReportType, setActiveReportType] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectData, setSelectedProjectData] = useState(null);

  const [managersData, setManagersData] = useState([]);
  const [riskReportData, setRiskReportData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportType, setExportType] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [projData, mgrData] = await Promise.all([
        reportService.getProjects(),
        reportService.getManagerReportData(),
      ]);
      setProjects(projData);
      setManagersData(mgrData);
    } catch (error) {
      console.error("Error initializing report data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const backToHub = () => {
    setActiveReportType(null);
    setSelectedProjectId("");
    setSelectedProjectData(null);
    setRiskReportData(null);
    if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
    setPreviewPdfUrl(null);
  };

  const handleProjectSelect = async (projectIdStr) => {
    setSelectedProjectId(projectIdStr);
    if (!projectIdStr) {
      setSelectedProjectData(null);
      setRiskReportData(null);
      if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
      return;
    }

    if (activeReportType === "complete") {
      loadCompleteProjectPreview(projectIdStr);
    } else if (activeReportType === "risk") {
      loadRiskAssessmentPreview(projectIdStr);
    }
  };

  const handleReportTypeSelect = (type) => {
    setActiveReportType(type);

    if ((type === "complete" || type === "risk") && projects && projects.length > 0) {
      const firstProjectId = String(projects[0].projectId);
      setSelectedProjectId(firstProjectId);
      if (type === "complete") {
        loadCompleteProjectPreview(firstProjectId);
      } else {
        loadRiskAssessmentPreview(firstProjectId);
      }
    } else if (type === "manager") {
      loadManagerReportPreview();
    }
  };

  const loadManagerReportPreview = async () => {
    setPreviewLoading(true);
    try {
      const blobData = await reportService.downloadManagerReport("pdf");
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (error) {
      console.error("Error loading manager report preview data:", error);
      setPreviewPdfUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadCompleteProjectPreview = async (projectIdStr) => {
    setPreviewLoading(true);
    try {
      const blobData = await reportService.downloadCompleteProjectReport(projectIdStr, "pdf");
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setSelectedProjectData(true);
    } catch (error) {
      console.error("Error loading project preview data:", error);
      setSelectedProjectData(null);
      setPreviewPdfUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadRiskAssessmentPreview = async (projectIdStr) => {
    setPreviewLoading(true);
    try {
      const blobData = await reportService.downloadRiskAssessmentReport(projectIdStr, "pdf");
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setRiskReportData(true);
    } catch (error) {
      console.error("Error loading risk assessment preview data:", error);
      setRiskReportData(null);
      setPreviewPdfUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadCompleteProject = async (format) => {
    if (!selectedProjectId) return;
    setDownloading(true);
    setExportType(format);

    const extension = format === "excel" ? "xlsx" : "pdf";
    const mimeType =
      format === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    try {
      const blobData = await reportService.downloadCompleteProjectReport(selectedProjectId, format);
      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Complete_Project_Report_proj_${selectedProjectId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading complete project report:", error);
      alert("Failed to download report package.");
    } finally {
      setDownloading(false);
      setExportType("");
    }
  };

  const handleDownloadManagerReport = async (format) => {
    setDownloading(true);
    setExportType(format);
    const mimeType =
      format === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";
    const extension = format === "excel" ? "xlsx" : "pdf";

    try {
      const blobData = await reportService.downloadManagerReport(format);
      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Project_Managers_Overview_Report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading manager report:", error);
      alert("Failed to download project manager overview report.");
    } finally {
      setDownloading(false);
      setExportType("");
    }
  };

  const handleDownloadSingleRiskReport = async (format) => {
    if (!selectedProjectId) return;
    setDownloading(true);
    setExportType(format);

    const extension = format === "excel" ? "xlsx" : "pdf";
    const mimeType =
      format === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    try {
      const blobData = await reportService.downloadRiskAssessmentReport(selectedProjectId, format);
      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Risk_Assessment_Report_proj_${selectedProjectId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading risk report:", error);
      alert("Failed to download risk assessment report.");
    } finally {
      setDownloading(false);
      setExportType("");
    }
  };

  const getRiskLevelBadge = (level) => {
    const l = level ? String(level).toUpperCase() : "NORMAL";
    if (l === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
          <FaExclamationTriangle className="text-[9px]" /> HIGH RISK
        </span>
      );
    }
    if (l === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
          <FaExclamationCircle className="text-[9px]" /> MEDIUM RISK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <FaCheckCircle className="text-[9px]" /> LOW RISK
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar open={open} setOpen={setOpen} />

      <main
        style={{ "--sidebar-w": open ? "16rem" : "5rem" }}
        className={`relative z-10 flex-1 min-w-0 transition-all duration-300 p-6 lg:p-8 ${open ? "ml-64" : "ml-20"}`}
      >
        {/* Top bar */}
        <div className="mb-5">
          <TopBar
            title={<>R&D Director <span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">Reports</span></>}
            subtitle={activeReportType ? "Configuring and exporting reports" : <>Analytics · PERT Risk Audits · Jasper Export Console</>}
          />
        </div>

        <div key="reports">

          {/* ════════════════ VIEW 1: HUB OVERVIEW ════════════════ */}
          {!activeReportType && (
            <div className="space-y-5">
              {/* Metric cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Module Categories
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">
                        3 <span className="text-xs font-medium text-slate-400">Active Suites</span>
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-600">
                      <FaLayerGroup />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Export Formats
                      </p>
                      <h3 className="mt-1 text-base font-bold text-blue-600">
                        PDF & XLSX
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-600">
                      <FaChartBar />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Security Clearance
                      </p>
                      <h3 className="mt-1 text-base font-bold text-amber-600">
                        Director
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-sm text-amber-600">
                      <FaShieldAlt />
                    </div>
                  </div>
                </div>
              </div>

              {/* Report selection cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* Card 1: Project Manager Reports */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-black text-lg">
                      <FaUserTie />
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                      Project Managers Overview
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Comprehensive performance audit and workload summary across all managers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleReportTypeSelect("manager")}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 py-2.5 text-xs font-semibold text-black transition hover:bg-blue-300 cursor-pointer"
                    >
                      <FaEye /> Launch Manager Report
                    </button>
                  </div>
                </div>

                {/* Card 2: Complete Project Report */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-black text-lg">
                      <FaFolderOpen />
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                      Complete Project Report
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Deep-dive analytical suite with milestones, schedules, and risk matrices.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleReportTypeSelect("complete")}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 py-2.5 text-xs font-semibold text-black transition hover:bg-blue-300 cursor-pointer"
                    >
                      <FaEye /> Select Project & Stream
                    </button>
                  </div>
                </div>

                {/* Card 3: Risk Assessment Report */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-black text-lg">
                      <FaExclamationTriangle />
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                      Risk Assessment Report
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      PERT schedule risk report with Z-score, probability, and deviation metrics.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleReportTypeSelect("risk")}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-100 py-2.5 text-xs font-semibold text-black transition hover:bg-amber-300 cursor-pointer"
                    >
                      <FaEye /> Select Project Risk Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ VIEW 2: COMPLETE PROJECT REPORT ════════════════ */}
          {activeReportType === "complete" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={backToHub}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <FaArrowLeft /> Back to Reports Hub
                </button>
              </div>

              {/* Project selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Target Project
                  </label>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Required
                  </span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                    <FaSpinner className="animate-spin text-sm text-blue-600" />
                    Loading projects...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 pr-10 text-xs font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="" className="text-slate-400">
                        -- Choose a project --
                      </option>
                      {projects.map((proj) => (
                        <option key={proj.projectId} value={proj.projectId} className="font-medium text-slate-900">
                          {proj.projectName} (ID: #{proj.projectId})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaChevronDown className="text-[10px]" />
                    </div>
                  </div>
                )}
              </div>

              {selectedProjectData ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Preview header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Complete Project Report</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-600">InnovatePERT</p>
                      <p className="text-[9px] text-slate-400">Official Document</p>
                    </div>
                  </div>

                  {/* PDF preview */}
                  <div className="w-full bg-slate-100" style={{ height: "65vh", minHeight: "500px" }}>
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                      </div>
                    ) : previewPdfUrl ? (
                      <iframe src={previewPdfUrl} className="w-full h-full border-0" title="Complete Project Report PDF" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500">
                        Failed to load PDF preview.
                      </div>
                    )}
                  </div>

                  {/* Download actions */}
                  <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleDownloadCompleteProject("pdf")}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                    >
                      {downloading && exportType === "pdf" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadCompleteProject("excel")}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                    >
                      {downloading && exportType === "excel" ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
                      Download Excel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400">
                    <FaFolderOpen />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Project Selected</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Select a project from the dropdown to load its comprehensive report.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ VIEW 3: PROJECT MANAGER REPORTS ════════════════ */}
          {activeReportType === "manager" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={backToHub}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <FaArrowLeft /> Back to Reports Hub
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Preview header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Project Managers Overview</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-600">InnovatePERT</p>
                    <p className="text-[9px] text-slate-400">Official Document</p>
                  </div>
                </div>

                {/* PDF preview */}
                <div className="w-full bg-slate-100" style={{ height: "65vh", minHeight: "500px" }}>
                  {previewLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                    </div>
                  ) : previewPdfUrl ? (
                    <iframe src={previewPdfUrl} className="w-full h-full border-0" title="Project Managers Overview PDF" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-500">
                      Failed to load PDF preview.
                    </div>
                  )}
                </div>

                {/* Download actions */}
                <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleDownloadManagerReport("pdf")}
                    disabled={downloading}
                    className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                  >
                    {downloading && exportType === "pdf" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleDownloadManagerReport("excel")}
                    disabled={downloading}
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                  >
                    {downloading && exportType === "excel" ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ VIEW 4: RISK ASSESSMENT REPORT ════════════════ */}
          {activeReportType === "risk" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={backToHub}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <FaArrowLeft /> Back to Reports Hub
                </button>
              </div>

              {/* Project selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Project for Risk Report
                  </label>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    PERT Engine
                  </span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                    <FaSpinner className="animate-spin text-sm text-amber-600" />
                    Loading projects...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 pr-10 text-xs font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="" className="text-slate-400">
                        -- Choose a project --
                      </option>
                      {projects.map((proj) => (
                        <option key={proj.projectId} value={proj.projectId} className="font-medium text-slate-900">
                          {proj.projectName} (ID: #{proj.projectId})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaChevronDown className="text-[10px]" />
                    </div>
                  </div>
                )}
              </div>

              {riskReportData ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Preview header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Project Risk Assessment</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-600">InnovatePERT</p>
                      <p className="text-[9px] text-slate-400">Official Document</p>
                    </div>
                  </div>

                  {/* PDF preview */}
                  <div className="w-full bg-slate-100" style={{ height: "65vh", minHeight: "500px" }}>
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <FaSpinner className="animate-spin text-amber-600 text-2xl" />
                      </div>
                    ) : previewPdfUrl ? (
                      <iframe src={previewPdfUrl} className="w-full h-full border-0" title="Risk Assessment Report PDF" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500">
                        Failed to load PDF preview.
                      </div>
                    )}
                  </div>

                  {/* Download actions */}
                  <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleDownloadSingleRiskReport("pdf")}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                    >
                      {downloading && exportType === "pdf" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadSingleRiskReport("excel")}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                    >
                      {downloading && exportType === "excel" ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
                      Download Excel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-500">
                    <FaExclamationTriangle />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Project Selected</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Select a project to load its PERT schedule risk metrics.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default AdminReports;
