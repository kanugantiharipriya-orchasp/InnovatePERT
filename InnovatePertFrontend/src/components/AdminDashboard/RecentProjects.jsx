import { FaRegCalendarAlt } from "react-icons/fa";

const statusStyle = {
  COMPLETED:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  IN_PROGRESS: "bg-blue-50 text-blue-600 ring-blue-200",
  NOT_STARTED: "bg-slate-100 text-slate-500 ring-slate-200",
  ASSIGNED:    "bg-sky-50 text-sky-600 ring-sky-200",
};

const statusDot = {
  COMPLETED:   "bg-emerald-500",
  IN_PROGRESS: "bg-blue-500",
  NOT_STARTED: "bg-slate-400",
  ASSIGNED:    "bg-sky-500",
};

const barColor = (v) =>
  v >= 75 ? "from-emerald-400 to-teal-500"
  : v >= 50 ? "from-sky-400 to-blue-500"
  : v >= 25 ? "from-amber-400 to-orange-500"
  : "from-rose-400 to-red-500";

const statusKey = (s) => String(s || "").toUpperCase().replace(/\s+/g, "_");

function RecentProjects({ projects, loading }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white
       transition-all duration-300
      hover:shadow-xl hover:shadow-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl
            bg-linear-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-200">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0a2.25 2.25 0 012.25-2.25H21a2.25 2.25 0 012.25 2.25v2.25A2.25 2.25 0 0121 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm10.5 0A2.25 2.25 0 0116.5 13.5H21a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0121 20.25h-2.25A2.25 2.25 0 0116.5 18v-2.25z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Recent Projects</p>
            <p className="text-xs text-slate-400">Latest project activity</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!loading && projects.length > 0 && (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 ring-1 ring-sky-100">
              {projects.length} projects
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/95 shadow-[0_16px_40px_-18px_rgba(2,132,199,0.14),0_2px_6px_-2px_rgba(2,132,199,0.06)]">
        <table className="w-full text-sm">           <thead className="[&_th]:bg-[linear-gradient(92deg,#eff6ff,#dbeafe)] [&_th]:text-blue-700 [&_th]:font-bold [&_th]:tracking-[0.04em] [&_th]:uppercase [&_th]:text-[0.72rem] [&_th]:border-none">
             <tr className="text-left">
<th className="px-6 py-4">Project Name</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Manager</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Completion</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    <span className="text-sm">Loading projects…</span>
                  </div>
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-slate-400">No projects found.</td>
              </tr>
            ) : (
              projects.map((p, i) => {
                const key = statusKey(p.status);
                const prob = p.completionPercentage != null ? Math.round(p.completionPercentage) : (p.completionProbability != null ? Math.round(p.completionProbability) : null);
                return (
                  <tr key={p.projectId ?? i} className="border-b border-slate-100/70 transition-colors duration-200 hover:bg-[#f0f9ff]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot[key] || "bg-slate-300"}`} />
                        <span className="font-semibold text-slate-800">{p.projectName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{p.projectManagerName || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1
                        text-xs font-bold ring-1 ${statusStyle[key] || "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full
                            ${statusDot[key] || "bg-slate-400"} opacity-60`} />
                          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full
                            ${statusDot[key] || "bg-slate-400"}`} />
                        </span>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {prob != null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className={`h-full rounded-full bg-linear-to-r ${barColor(prob)} transition-all duration-700`}
                              style={{ width: `${Math.min(prob, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{prob}%</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <FaRegCalendarAlt className="text-slate-300" size={11} />
                        {p.targetDate || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentProjects;
