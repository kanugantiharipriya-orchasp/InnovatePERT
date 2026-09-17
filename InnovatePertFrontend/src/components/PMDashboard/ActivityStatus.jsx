import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ActivityStatus({ activityData, loading }) {
  const data = [
    { name: "Completed",   value: activityData.completed  || 0 },
    { name: "In Progress", value: activityData.inProgress || 0 },
    { name: "Not Started", value: activityData.notStarted || 0 },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/80">
      <p className="text-base font-bold text-slate-800">Activity Status</p>
      <p className="mb-4 text-xs text-slate-400">Activities breakdown by status</p>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        </div>
      ) : data.every(d => d.value === 0) ? (
        <div className="flex h-52 items-center justify-center text-sm text-slate-400">
          No activities found
        </div>
      ) : (
        <div className="relative h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {/* Gradient setup for the area fill */}
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines only for a clean look */}
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
              />
              
              <YAxis 
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
              
              <Area
                type="monotone" /* Gives the line a smooth, curved shape */
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ActivityStatus;