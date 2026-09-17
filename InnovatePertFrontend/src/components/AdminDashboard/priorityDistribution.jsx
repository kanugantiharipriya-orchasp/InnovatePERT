import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const BARS = [
  {
    key: "high",
    name: "High",
    from: "#f43f5e",
    to: "#ef4444",
    dot: "bg-rose-500",
  },
  {
    key: "medium",
    name: "Medium",
    from: "#f59e0b",
    to: "#f97316",
    dot: "bg-amber-500",
  },
  {
    key: "low",
    name: "Low",
    from: "#10b981",
    to: "#14b8a6",
    dot: "bg-emerald-500",
  },
];

function PriorityDistribution({ priorityData, loading }) {
  const data = BARS.map((b) => ({
    name: b.name,
    value: priorityData[b.key] || 0,
    from: b.from,
    to: b.to,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6
       transition-all duration-300
      hover:shadow-xl hover:shadow-slate-200/80"
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl
          bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm2 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm2 6a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-slate-800">
            Priority Distribution
          </p>
          <p className="text-xs text-slate-400">Projects by priority level</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        </div>
      ) : total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                data={data}
                margin={{ top: 22, right: 8, left: -24, bottom: 0 }}
                barCategoryGap="32%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(245,158,11,0.06)" }}
                  formatter={(v, n) => [`${v} projects`, n]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={44}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={`url(#prio-${entry.name})`} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fontSize: 13, fontWeight: 800, fill: "#0f172a" }}
                  />
                </Bar>
                <defs>
                  {data.map((entry) => (
                    <linearGradient
                      key={entry.name}
                      id={`prio-${entry.name}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.from} />
                      <stop offset="100%" stopColor={entry.to} />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* legend chips */}
          <div className="mt-2 flex items-center justify-center gap-4">
            {BARS.map((b) => (
              <span
                key={b.key}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"
              >
                <span className={`h-2 w-2 rounded-full ${b.dot}`} />
                {b.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-700">
              Total: {total}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default PriorityDistribution;
