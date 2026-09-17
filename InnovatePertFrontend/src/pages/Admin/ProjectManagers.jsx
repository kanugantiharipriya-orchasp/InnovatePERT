import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  UserX,
  FolderKanban,
  Plus,
  Search,
  Filter,
  AlertCircle,
  X,
  Download,
} from "lucide-react";

import { FaCheckCircle, FaFileExcel, FaSpinner, FaDownload } from "react-icons/fa";
import AdminSidebar from "./AdminSidebar";
import { projectManagerService } from "../../services/projectManagerService";
import { projectService } from "../../services/projectService";
import ProjectManagerTable from "./ProjectManagerTable";
import AssignProjectModal from "../../components/AssignProjectModal";
import CreateManagerModal from "../../components/CreateManagerModal";
import EditManagerModal from "../../components/EditManagerModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import DeactivateConfirmModal from "../../components/DeactivateConfirmModal";

function ProjectManagers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  const [projects, setProjects] = useState([]);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchManagers = async () => {
  setLoading(true);
  setError("");
  try {
    // 1. Fetch Managers first
    let managersData = [];
    if (searchTerm.trim() !== "") {
      managersData = await projectManagerService.search(searchTerm.trim());
    } else if (statusFilter !== "ALL") {
      managersData = await projectManagerService.filterByStatus(statusFilter);
    } else {
      managersData = await projectManagerService.getAll();
    }
    setManagers(managersData || []);

    // 2. Fetch Projects safely in a separate try-catch block
    try {
      const projectsData = await projectService.getAllProjects();
      console.log("Projects API Success:", projectsData);
      setProjects(projectsData || []);
    } catch (projErr) {
      console.error("Failed to fetch projects specifically:", projErr);
      setProjects([]);
    }

  } catch (err) {
    console.error("Failed to fetch managers:", err);
    setError(err.message || "Failed to load Project Managers from backend.");
    setManagers([]);
  } finally {
    setLoading(false);
  }
};
  // Instant live search & status filter effect with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchManagers();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter]);

  // Robust KPI Stats calculation handling object arrays or direct count
  const stats = {
    total: managers.length,
    active: managers.filter((m) => m.status === "ACTIVE").length,
    inactiveOrDeleted: managers.filter(
      (m) => m.status === "INACTIVE" || m.status === "DELETED"
    ).length,
    ProjectsAssigned: managers.reduce((acc, curr) => {
      const count =
        curr.projectCount ??
        curr.projects?.length ??
        curr.assignedProjects?.length ??
        0;
      return acc + count;
    }, 0),
  };

  const handleStatusToggle = async (manager, targetStatus) => {
    if (targetStatus === "INACTIVE") {
      // Open the deactivate confirmation modal instead of acting directly
      setSelectedManager(manager);
      setIsDeactivateModalOpen(true);
      return;
    }
    try {
      if (targetStatus === "ACTIVE") {
        await projectManagerService.activate(manager.userId);
        setSuccessMessage(`Successfully activated ${manager.fullName}!`);
      }
      fetchManagers();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      alert(
        "Failed to change manager status: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(""); // clear previous errors
    try {
      const result = await projectManagerService.uploadExcel(file);
      const count = result?.length || 0;
      setSuccessMessage(`Successfully uploaded ${count} Project Managers. All created Project Managers are now available for project assignment.`);
      fetchManagers();
      setTimeout(() => setSuccessMessage(""), 7000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Excel upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await projectManagerService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ProjectManager_BulkUpload_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      setError("Failed to download template. Please try again.");
    }
  };

  return (
    <div className="relative bg-white min-h-screen font-sans flex">
      <AdminSidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`relative z-10 flex-1 p-8 transition-all duration-300 overflow-x-hidden ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Success Banner with Manual Close Option */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-8 flex items-center justify-between text-emerald-700 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <FaCheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          {/* <h1 className="text-4xl font-bold text-slate-800">
            Project Managers
          </h1> */}

          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl
              bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Project <span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">Managers</span>
              </h1>
              <p className="text-sm text-slate-500">Manage accounts, status and project assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Hidden Excel File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {/* Download Template Button */}
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
              title="Download Excel Template"
            >
              <FaDownload />
              Template
            </button>

            {/* Upload Excel Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileExcel />
              )}
              {uploading ? "Importing..." : "Upload Excel"}
            </button>

            {/* Create Manager Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] px-5 py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-300/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={20} /> Create Manager
            </button>
          </div>
        </div>

        {/* Instruction Banner for Bulk Upload */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6 flex items-start gap-3 text-blue-800 shadow-sm">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">
            <strong>Bulk Upload Instructions:</strong> Please use the provided Excel template to upload Project Manager details. Do not change the column names, column order, or template structure.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-8 flex items-center gap-3 text-red-700 shadow-sm">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
  {/* Total Accounts */}
  <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-md shadow-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-5 min-h-25">
    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
      <Users className="text-white text-2xl" />
    </div>

    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-700">
        Total Accounts
      </p>

      <h3 className="text-2xl font-bold text-cyan-600 mt-1">
        {loading ? "-" : stats.total}
      </h3>
    </div>
  </div>

  {/* Active */}
  <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-md shadow-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-5 min-h-[100px]">
    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg">
      <UserCheck className="text-white text-2xl" />
    </div>

    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-700">
        Active
      </p>

      <h3 className="text-2xl font-bold text-emerald-600 mt-1">
        {loading ? "-" : stats.active}
      </h3>
    </div>
  </div>

  {/* Inactive */}
  <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-md shadow-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-5 min-h-[100px]">
    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-lg">
      <UserX className="text-white text-2xl" />
    </div>

    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-700">
        Inactive
      </p>

      <h3 className="text-2xl font-bold text-rose-600 mt-1">
        {loading ? "-" : stats.inactiveOrDeleted}
      </h3>
    </div>
  </div>

  {/* Total Projects */}
  <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-md shadow-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-5 min-h-[100px]">
    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg">
      <FolderKanban className="text-white text-2xl" />
    </div>

    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-700">
        Total Projects
      </p>

      <h3 className="text-2xl font-bold text-violet-600 mt-1">
        {projects.length}
      </h3>
    </div>
  </div>
</div>

        {/* Live Search and Filters */}
        <div className="p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-medium text-slate-700"
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-slate-500 font-bold text-sm flex items-center gap-1.5 shrink-0">
              <Filter size={15} className="text-cyan-500" /> Filter:
            </span>
            <div className="relative w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-sm cursor-pointer shadow-sm appearance-none pr-10"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DELETED">Deleted</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Live Responsive Data Table */}
        <ProjectManagerTable
          managers={managers}
          projects={projects}
          loading={loading}
          onAssignProject={(manager) => {
            setSelectedManager(manager);
            setIsAssignModalOpen(true);
          }}
          onEdit={(manager) => {
            setSelectedManager(manager);
            setIsEditModalOpen(true);
          }}
          onSoftDelete={(manager) => {
            setSelectedManager(manager);
            setIsDeleteModalOpen(true);
          }}
          onToggleStatus={handleStatusToggle}
        />

        {/* Modals with Success Feedback */}
        <AssignProjectModal
          isOpen={isAssignModalOpen}
          manager={selectedManager}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedManager(null);
          }}
          onSuccess={(assignedData) => {
            const managerName =
              assignedData?.managerName ||
              selectedManager?.fullName ||
              "Manager";
            setSuccessMessage(
              `Project successfully assigned to ${managerName}!`
            );
            fetchManagers();
            setIsAssignModalOpen(false);
            setSelectedManager(null);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />

        <CreateManagerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setSuccessMessage(
              "Project Manager created successfully! Credentials emailed."
            );
            fetchManagers();
            setIsCreateModalOpen(false);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />

        <EditManagerModal
          isOpen={isEditModalOpen}
          manager={selectedManager}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedManager(null);
          }}
          onSuccess={() => {
            setSuccessMessage(
              `Successfully updated details for ${
                selectedManager?.fullName || "Manager"
              }!`
            );
            fetchManagers();
            setIsEditModalOpen(false);
            setSelectedManager(null);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />

       <DeleteConfirmModal
  isOpen={isDeleteModalOpen}
  manager={selectedManager}
  onClose={() => {
    setIsDeleteModalOpen(false);
    setSelectedManager(null);
  }}
  onSuccess={() => {
    setSuccessMessage(
      `Project Manager ${
        selectedManager?.fullName || ""
      } has been deleted.`
    );
    fetchManagers();
    setIsDeleteModalOpen(false);
    setSelectedManager(null);
    setTimeout(() => setSuccessMessage(""), 5000);
  }}
/>

        <DeactivateConfirmModal
          isOpen={isDeactivateModalOpen}
          manager={selectedManager}
          onClose={() => {
            setIsDeactivateModalOpen(false);
            setSelectedManager(null);
          }}
          onSuccess={() => {
            setSuccessMessage(`Successfully deactivated ${selectedManager?.fullName}!`);
            fetchManagers();
            setIsDeactivateModalOpen(false);
            setSelectedManager(null);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />

      </div>
    </div>
  );
}

export default ProjectManagers;
