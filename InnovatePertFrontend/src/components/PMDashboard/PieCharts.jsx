import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaChartPie } from "react-icons/fa";

const COLORS = ["#0ea5e9", "#94a3b8", "#2563eb", "#10b981"];

function PieCharts({ statusData, loading }) {
  const data = [
    { name: "Not Started", value: statusData.notStarted  || 0 },
    { name: "In Progress", value: statusData.inProgress  || 0 },
    { name: "Completed",   value: statusData.completed   || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="relative bg-white border border-slate-200/90 shadow-[0_18px_44px_-22px_rgba(2,132,199,0.16),0_6px_18px_-14px_rgba(15,23,42,0.07)] rounded-3xl p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-blue-500 text-white shadow-md shadow-sky-200">
          <FaChartPie size={13} />
        </span>
        <div>
          <p className="text-base font-bold text-slate-800">Project Status</p>
          <p className="text-xs text-slate-400">Distribution by current status</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={35}
              dataKey="value"
              paddingAngle={3}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <Legend iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PieCharts;
