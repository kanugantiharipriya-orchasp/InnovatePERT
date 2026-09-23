import { useState } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaUserMinus,
  FaBriefcase,
  FaEnvelope,
  FaCalendarAlt,
  FaUserSlash,
  FaChevronLeft,
  FaChevronRight,
  FaUserTie,
} from "react-icons/fa";

function ProjectManagerTable({
  managers = [],
  projects = [],
  loading = false,
  onAssignProject,
  onEdit,
  onToggleStatus,
  onSoftDelete,
}) {
  // Client-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalItems = managers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  // Clamp the page when the list shrinks (search/filter/delete while on a deep page)
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = managers.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Status Badge Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            ACTIVE
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            INACTIVE
          </span>
        );
      case "DELETED":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-rose-50 px-3 py-1 text-[11px] font-bold tracking-wide text-rose-600">
            <FaUserSlash size={10} />
            DELETED
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            {status || "—"}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
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

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xl shadow-slate-200/50">
        <div className="relative mb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-sky-100 to-blue-100 text-cyan-500 shadow-inner">
            <FaUserTie size={30} />
          </div>
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg">
            0
          </span>
        </div>
        <h4 className="text-xl font-black text-slate-800">No Project Managers Found</h4>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          There are no records matching your criteria. Click{" "}
          <span className="font-bold text-cyan-600">"Create Manager"</span> to
          add a new account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 px-6 py-5">
        <div>
          <p className="text-sm font-black text-slate-800">Project Managers</p>
          <p className="text-xs text-slate-400">Accounts and assigned workloads</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
          <FaUserTie className="text-[11px]" />
          {totalItems} {totalItems === 1 ? "Manager" : "Managers"}
        </span>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
        <table className="w-full text-sm">
          <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
            <tr className="text-left">
              <th className="px-6 py-4">Manager</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Projects</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {currentItems.map((manager) => {
              // Filter projects dynamically for THIS manager
              const managerProjects = projects.filter((project) => {
                const assignedId =
                  project.assignedToId ??
                  project.assignedTo?.userId ??
                  project.assignedTo?.id;

                return Number(assignedId) === Number(manager.userId);
              });

              // Fallback to manager's own object properties if projects array is empty
              const projectCount =
                managerProjects.length > 0
                  ? managerProjects.length
                  : manager.projectCount ??
                    manager.projects?.length ??
                    manager.assignedProjects?.length ??
                    0;

              return (
                <tr
                  key={manager.userId}
                  className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]"
                >
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 transition-colors group-hover:text-sky-700">
                        {manager.fullName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <FaEnvelope className="shrink-0 text-slate-300" />
                        <span className="truncate">{manager.email || "—"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">{getStatusBadge(manager.status)}</td>

                  {/* Projects Column */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200/60">
                        <FaBriefcase className="text-cyan-500" />
                        {projectCount}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <FaCalendarAlt className="text-slate-300" />
                      {formatDate(manager.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2.5">
                      {/* Primary Action: Assign Project */}
                      {manager.status === "ACTIVE" && (
                        <button
                          onClick={() => onAssignProject && onAssignProject(manager)}
                          className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-sky-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-sky-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200 cursor-pointer"
                        >
                          <FaBriefcase className="text-[11px]" /> Assign
                        </button>
                      )}

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
                        {manager.status === "ACTIVE" && (
                          <button
                            onClick={() => onToggleStatus && onToggleStatus(manager, "INACTIVE")}
                            className="p-2 text-slate-400 transition-all duration-200 hover:scale-110 hover:bg-amber-50 hover:text-amber-500 cursor-pointer"
                            title="Deactivate"
                          >
                            <FaUserMinus size={15} />
                          </button>
                        )}

                        {manager.status === "INACTIVE" && (
                          <button
                            onClick={() => onToggleStatus && onToggleStatus(manager, "ACTIVE")}
                            className="p-2 text-slate-400 transition-all duration-200 hover:scale-110 hover:bg-emerald-50 hover:text-emerald-500 cursor-pointer"
                            title="Activate"
                          >
                            <FaCheckCircle size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => onEdit && onEdit(manager)}
                          className="p-2 text-slate-400 transition-all duration-200 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          title="Edit Details"
                        >
                          <FaEdit size={15} />
                        </button>

                        {manager.status !== "DELETED" && (
                          <button
                            onClick={() => onSoftDelete && onSoftDelete(manager)}
                            className="p-2 text-slate-400 transition-all duration-200 hover:scale-110 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <FaTrashAlt size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100/80 px-6 py-4 sm:flex-row">
        <div className="flex w-full items-center justify-center gap-4 text-xs text-slate-500 sm:w-auto sm:justify-start">
          <span>
            Showing{" "}
            <span className="font-black text-slate-800">{indexOfFirstItem + 1}</span>
            {" – "}
            <span className="font-black text-slate-800">
              {Math.min(indexOfLastItem, totalItems)}
            </span>{" "}
            of <span className="font-black text-sky-600">{totalItems}</span>
          </span>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="hidden sm:inline">Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            title="Previous page"
          >
            <FaChevronLeft size={12} />
          </button>

          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => goToPage(i + 1)}
                className={`h-8 w-8 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                  safePage === i + 1
                    ? "bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            title="Next page"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagerTable;
