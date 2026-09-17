import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DOT_CLS = ["bg-sky-500", "bg-slate-400", "bg-blue-600", "bg-emerald-500"];

const COLORS = ["#06b6d4", "#94a3b8", "#3b82f6", "#10b981"];

function PieCharts({ statusData, loading }) {
  const data = [
    { name: "Assigned", value: statusData.assigned || 0 },
    { name: "Not Started", value: statusData.notStarted || 0 },
    { name: "In Progress", value: statusData.inProgress || 0 },
    { name: "Completed", value: statusData.completed || 0 },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-6
       transition-all duration-300
      hover:shadow-xl hover:shadow-slate-200/80"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl
          bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 3.055A9 9 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-slate-800">Project Status</p>
          <p className="text-xs text-slate-400">
            Distribution by current status
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <>
          {/* Donut with center total */}
          <div className="relative flex-1 min-h-45">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  innerRadius={54}
                  dataKey="value"
                  paddingAngle={4}
                  cornerRadius={6}
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [
                    `${v} projects (${total ? Math.round((v / total) * 100) : 0}%)`,
                    n,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black tracking-tight text-slate-800">
                {total}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Projects
              </p>
            </div>
          </div>

          {/* Compact 2-Column Legend */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLS[i % DOT_CLS.length]}`}
                />
                <span className="truncate text-sm font-semibold text-slate-600">
                  {d.name}
                </span>
                <span className="ml-auto text-sm font-black text-slate-800">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PieCharts;
