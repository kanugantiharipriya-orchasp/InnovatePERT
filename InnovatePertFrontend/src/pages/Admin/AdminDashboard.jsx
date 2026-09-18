import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import TopBar from "../../components/TopBar";
import Cards from "../../components/AdminDashboard/Cards";
import PieCharts from "../../components/AdminDashboard/PieCharts";
import PriorityDistribution from "../../components/AdminDashboard/priorityDistribution";
import RiskOverview from "../../components/AdminDashboard/RiskOverview";
import RecentProjects from "../../components/AdminDashboard/RecentProjects";
import ProjectManagerPerformance from "../../components/AdminDashboard/ProjectManagerPerfomance";
import AdminProjects from "./AdminProjects";
import AdminRiskAnalysis from "./AdminRiskAnalysis";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalProjectManagers: 0,
    projectsAtRisk: 0,
  });

  const [statusData, setStatusData] = useState({
    notStarted: 0,
    inProgress: 0,
    completed: 0,
  });

  const [priorityData, setPriorityData] = useState({ high: 0, medium: 0, low: 0 });
  const [riskData, setRiskData] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [managerPerf, setManagerPerf]       = useState([]);

  useEffect(() => {
    async function fetchDashboard() {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        // Single consolidated API call
        const res = await fetch(`${API_BASE}/api/admin/dashboard/consolidated`, { headers });
        if (res.ok) {
          const json = await res.json();

          // ── Cards — top-level fields ──────────────────────────────────
          setStats({
            totalProjects:        json.totalProjects        ?? 0,
            activeProjects:       json.activeProjects       ?? 0,
            totalProjectManagers: json.totalProjectManagers ?? 0,
            projectsAtRisk:       json.projectsAtRisk       ?? 0,
          });

          // ── Pie chart — statusDistribution is a plain object ──────────
          // e.g. { "IN_PROGRESS": 2, "COMPLETED": 1, ... }
          if (json.statusDistribution) {
            const s = json.statusDistribution;
            setStatusData({
              notStarted: s.NOT_STARTED ?? 0,
              inProgress: s.IN_PROGRESS ?? 0,
              completed:  s.COMPLETED   ?? 0,
            });
          }

          // ── Priority bar — priorityDistribution is a plain object ─────
          // e.g. { "HIGH": 1, "MEDIUM": 8, "LOW": 2 }
          if (json.priorityDistribution) {
            const p = json.priorityDistribution;
            setPriorityData({
              high:   p.HIGH   ?? 0,
              medium: p.MEDIUM ?? 0,
              low:    p.LOW    ?? 0,
            });
          }

          // ── Risk overview — nested riskOverview object ────────────────
          if (json.riskOverview) {
            const r = json.riskOverview;
            setRiskData([
              { name: "Low Risk",       value: r.lowRiskCount      ?? 0 },
              { name: "Medium Risk",    value: r.mediumRiskCount   ?? 0 },
              { name: "High Risk",      value: r.highRiskCount     ?? 0 },
              { name: "Very High Risk", value: r.veryHighRiskCount ?? 0 },
            ]);
          }

          // ── Recent projects ───────────────────────────────────────────
          if (Array.isArray(json.recentProjects)) {
            setRecentProjects(json.recentProjects);
          }

          // ── Manager performance ───────────────────────────────────────
          if (Array.isArray(json.managerPerformance)) {
            setManagerPerf(json.managerPerformance);
          }
        } else {
          console.error("Admin Dashboard consolidated API failed:", res.status);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    /* Full-page background */
    <div className="relative bg-white flex min-h-screen">
      <AdminSidebar open={open} setOpen={setOpen} />

      <main
        style={{ "--sidebar-w": open ? "16rem" : "5rem" }}
        className={`relative z-10 flex-1 min-w-0 transition-all duration-300 p-6 lg:p-8 ${open ? "ml-64" : "ml-20"}`}
      >

        {/* Top bar — notifications, profile, logout (Dashboard page only) */}
        {location.pathname === "/admin/dashboard" && (
          <div className="mb-6">
            <TopBar
              title={<>R&D Director <span className="bg-[linear-gradient(92deg,#06b6d4_0%,#3b82f6_100%)] bg-clip-text text-transparent">Dashboard</span></>}
              subtitle={`${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Welcome back`}
              userName="Administrator"
              userRole="R&D Control Center"
              profilePath="/admin/admin-profile"
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* ── Section router ── */}
        {location.pathname === "/admin/projects" ? (
          <AdminProjects />
        ) : location.pathname === "/admin/risk-analysis" ? (
          <AdminRiskAnalysis />
        ) : (
          <div key="dashboard">
            {/* Cards */}
            <div className="mb-6">
              <Cards stats={stats} loading={loading} />
            </div>

            {/* Charts row */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <PieCharts statusData={statusData} loading={loading} />
              <PriorityDistribution priorityData={priorityData} loading={loading} />
              <RiskOverview riskData={riskData} loading={loading} />
            </div>

            {/* Recent Projects */}
            <div className="mb-6">
              <RecentProjects projects={recentProjects} loading={loading} />
            </div>

            {/* Manager Performance */}
            <div className="mb-6">
              <ProjectManagerPerformance managers={managerPerf} loading={loading} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
