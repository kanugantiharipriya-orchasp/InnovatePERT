import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { FaProjectDiagram } from "react-icons/fa";

function ProjectProgress({ progressData, loading }) {
  return (
    <div className="relative bg-white border border-slate-200/90 shadow-[0_18px_44px_-22px_rgba(2,132,199,0.16),0_6px_18px_-14px_rgba(15,23,42,0.07)] rounded-3xl p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <span
          className="
            flex h-8 w-8 items-center justify-center
            rounded-xl
            bg-linear-to-br from-blue-400 to-sky-500
            text-white
            shadow-md shadow-blue-200
          "
        >
          <FaProjectDiagram size={13} />
        </span>

        <div>
          <p className="text-base font-bold text-slate-800">
            Project Progress
          </p>

          <p className="text-xs text-slate-400">
            Project completion and budget overview
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div
            className="
              h-10 w-10
              animate-spin
              rounded-full
              border-4
              border-cyan-400
              border-t-transparent
            "
          />
        </div>
      ) : progressData.length === 0 ? (
        /* Empty State */
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          No project data available
        </div>
      ) : (
        /* Chart */
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={progressData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />

            {/* X Axis */}
            <XAxis
              dataKey="projectName"
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value.length > 12
                  ? `${value.substring(0, 12)}...`
                  : value
              }
            />

            {/* Left Axis - Completion */}
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />

            {/* Right Axis - Budget */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `₹${value}`}
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{
                fill: "rgba(59,130,246,0.05)",
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                backgroundColor: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              formatter={(value, name) => {
                if (name === "Completion") {
                  return [`${value}%`, name];
                }

                if (name === "Budget") {
                  return [`₹${value}`, name];
                }

                return [value, name];
              }}
            />

            {/* Legend */}
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="rect"
              wrapperStyle={{
                fontSize: "12px",
                color: "#64748b",
              }}
            />

            {/* Blue Bars */}
            <Bar
              yAxisId="left"
              dataKey="completion"
              name="Completion"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />

            {/* Orange Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="budget"
              name="Budget"
              stroke="#f97316"
              strokeWidth={3}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ProjectProgress;