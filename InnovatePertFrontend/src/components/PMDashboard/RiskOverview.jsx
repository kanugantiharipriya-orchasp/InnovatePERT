import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#0ea5e9"];

// Custom SVG shape to create the minimalist "lollipop" look
const LollipopShape = (props) => {
  const { fill, x, y, width, height } = props;
  const centerY = y + height / 2;

  // Don't render anything if the value is 0 to keep it clean
  if (width === 0) return null;

  return (
    <g>
      {/* The thin "wick" line */}
      <line
        x1={x}
        y1={centerY}
        x2={x + width - 5} // Stop slightly before the circle
        y2={centerY}
        stroke={fill}
        strokeWidth={2}
        strokeOpacity={0.7}
      />
      {/* The indicator dot at the end */}
      <circle
        cx={x + width}
        cy={centerY}
        r={7}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2.5}
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" }}
      />
    </g>
  );
};

function RiskOverview({ riskData, loading }) {
  // Map the API data into a clean array
  const data = Array.isArray(riskData)
    ? riskData.map((item) => ({
        name:  item.name  || item.riskLevel  || "",
        value: item.value ?? item.projectCount ?? item.count ?? 0,
      }))
    : [
        { name: "Low Risk",       value: riskData?.lowRiskCount    ?? riskData?.lowRisk      ?? 0 },
        { name: "Medium Risk",    value: riskData?.mediumRiskCount ?? riskData?.mediumRisk   ?? 0 },
        { name: "High Risk",      value: riskData?.highRiskCount   ?? riskData?.highRisk     ?? 0 },
        { name: "Very High Risk", value: riskData?.criticalRiskCount ?? riskData?.veryHighRiskCount ?? riskData?.veryHighRisk ?? 0 },
      ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/80">
      <p className="text-base font-bold text-slate-800">Risk Overview</p>
      <p className="mb-4 text-xs text-slate-400">
        Projects by completion probability
      </p>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-400 border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 25, left: 10, bottom: 5 }}
          >
            {/* Minimalist vertical grid lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              horizontal={false}
            />

            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(241, 245, 249, 0.4)" }} // Soft hover background
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
            {/* Pass our custom shape to the Bar component */}
            <Bar dataKey="value" shape={<LollipopShape />} maxBarSize={32}>
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default RiskOverview;