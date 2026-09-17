import {
  FaProjectDiagram,
  FaCheckCircle,
  FaClock,
  FaSpinner,
} from "react-icons/fa";

// Admin-style summary cards — same visual language as the Admin Dashboard
const cards = [
  {
    label: "Total Projects",
    icon: FaProjectDiagram,
    gradient: "from-cyan-400 to-blue-600",
    valueColor: "text-cyan-600",
    key: "totalProjects",
  },
  {
    label: "Active Projects",
    icon: FaSpinner,
    gradient: "from-sky-400 to-blue-600",
    valueColor: "text-sky-600",
    key: "activeProjects",
  },
  {
    label: "Completed",
    icon: FaCheckCircle,
    gradient: "from-emerald-400 to-green-600",
    valueColor: "text-emerald-600",
    key: "completedProjects",
  },
  {
    label: "Upcoming Deadlines",
    icon: FaClock,
    gradient: "from-amber-400 to-orange-500",
    valueColor: "text-amber-600",
    key: "upcomingDeadlines",
  },
];

function Cards({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="
              flex items-center gap-4
              rounded-md
              border border-slate-300
              bg-white
              hover:-translate-y-1
              transition-all duration-300
              p-4
              min-h-22.5
            "
          >
            {/* Icon */}
            <div
              className={`
                w-10 h-10
                rounded-2xl
                bg-linear-to-br ${card.gradient}
                flex items-center justify-center
                shrink-0
              `}
            >
              <Icon className="text-white text-2xl" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {card.label}
              </p>

              {loading ? (
                <div className="mt-2 h-6 w-12 rounded bg-gray-300 animate-pulse"></div>
              ) : (
                <h2 className={`text-2xl font-bold mt-1 ${card.valueColor}`}>
                  {stats[card.key] ?? 0}
                </h2>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Cards;
