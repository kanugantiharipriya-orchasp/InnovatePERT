import { useState } from "react";
import { FaUsers, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

function ProjectManagerPerformance({ managers, loading }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalRecords = managers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageData = managers.slice(startIdx, startIdx + pageSize);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white
      transition-all duration-300
      hover:shadow-xl hover:shadow-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl
            bg-linear-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-200">
            <FaUsers size={15} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Project Manager Performance</p>
            <p className="text-xs text-slate-400">Breakdown by project status per manager</p>
          </div>
        </div>
        {!loading && managers.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
            {managers.length} managers
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
        <table className="w-full text-sm">           <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
             <tr className="text-left">
<th className="px-6 py-4">Manager</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Distribution</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Not Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                    <span className="text-sm">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-slate-400">No data available.</td>
              </tr>
            ) : (
              pageData.map((m, i) => {
                const done = m.completedProjects ?? 0;
                const prog = m.inProgressProjects ?? 0;
                const todo = m.notStartedProjects ?? 0;
                const total = done + prog + todo || 1;
                const segments = [
                  { v: done, cls: "bg-emerald-500", label: "Completed" },
                  { v: prog, cls: "bg-blue-500", label: "In Progress" },
                  { v: todo, cls: "bg-slate-300", label: "Not Started" },
                ];
                return (
                  <tr key={startIdx + i} className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]">
                    {/* Manager */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{m.managerName}</p>
                        <p className="text-[11px] font-medium text-slate-400">{total} projects total</p>
                      </div>
                    </td>
                    {/* Stacked distribution bar */}
                    <td className="px-6 py-4">
                      <div className="flex w-36 items-center gap-2">
                        <div className="flex h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          {segments.map((s) => (
                            <div
                              key={s.label}
                              className={`${s.cls} transition-all duration-700`}
                              style={{ width: `${(s.v / total) * 100}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {segments.map((s) => (
                            <span key={s.label} title={s.label}
                              className={`h-1.5 w-1.5 rounded-full ${s.cls}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    {/* Counts */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50
                        px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {done}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50
                        px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {prog}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100
                        px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {todo}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && totalRecords > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100/80 bg-white/60 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-black text-slate-800">{startIdx + 1}</span>{" "}
              –{" "}
              <span className="font-black text-slate-800">
                {Math.min(startIdx + pageSize, totalRecords)}
              </span>{" "}
              of{" "}
              <span className="font-black text-emerald-600">{totalRecords}</span>{" "}
              managers
            </span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              title="Previous page"
            >
              <FaChevronLeft size={12} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`h-8 w-8 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                  safePage === i + 1
                    ? "bg-linear-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-200"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              title="Next page"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagerPerformance;
