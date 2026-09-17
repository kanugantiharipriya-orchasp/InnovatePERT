import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// Convert riskData → flat array for the area chart
// x-axis = risk level label, y-axis = project count
function buildData(riskData) {
  if (Array.isArray(riskData)) {
    // Array already has { name, value } shape — use directly
    return riskData.map((item) => ({
      name:  item.name  || item.riskLevel || item.risk || "",
      value: item.value ?? item.projectCount ?? item.count ?? 0,
    }));
  }
  // Plain object — read explicit count fields
  return [
    { name: "Low Risk",       value: riskData.lowRiskCount   ?? riskData.lowRisk      ?? 0 },
    { name: "Medium Risk",    value: riskData.mediumRiskCount ?? riskData.mediumRisk   ?? 0 },
    { name: "High Risk",      value: riskData.highRiskCount  ?? riskData.highRisk     ?? 0 },
    { name: "Very High Risk", value: riskData.veryHighRiskCount ?? riskData.veryHighRisk ?? 0 },
  ];
}

function RiskOverview({ riskData, loading }) {
  const data = buildData(riskData);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5
      transition-all duration-300 hover:shadow-xl">

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl
          bg-linear-to-br from-sky-400 to-blue-500 text-white shadow-md shadow-sky-200">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-slate-800">Risk Overview</p>
          <p className="text-xs text-slate-400">Projects by risk level</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4
            border-sky-400 border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#bae6fd" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="#e2e8f0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              formatter={(v) => [v, "Projects"]}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#riskGrad)"
              dot={{ r: 4, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default RiskOverview;
