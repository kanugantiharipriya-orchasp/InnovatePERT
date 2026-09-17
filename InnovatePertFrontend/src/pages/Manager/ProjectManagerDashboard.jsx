import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ManagerSidebar from "./ManagerSidebar";
import TopBar from "../../components/TopBar";
import ManagerProjects from "./ManagerProjects";
import ManagerProfile from "./ManagerProfile";
import PertAnalysis from "../Manager/PertAnalysis";
import ManagerReports from "../Manager/ManagerReports";
import ManagerActivities from "./ManagerActivities";
import ManagerRiskAssessment from "./ManagerRiskAssessment";
import ManagerProjectCrashing from "./ManagerProjectCrashing";
import Cards from "../../components/PMDashboard/Cards";
import PieCharts from "../../components/PMDashboard/PieCharts";
import ProjectProgress from "../../components/PMDashboard/ProjectProgress";
import RiskOverview from "../../components/PMDashboard/RiskOverview";
import ActivityStatus from "../../components/PMDashboard/ActivityStatus";

const API_BASE = "http://localhost:8080";


// Map URL path segments to section keys
const pathToSection = {
  "/project-manager/dashboard": "dashboard",
  "/project-manager/projects": "projects",
  "/project-manager/activities": "activities",
  "/project-manager/pert-analysis": "pert-analysis",
  "/project-manager/risk-assessment": "risk-assessment",
  "/project-manager/calculate-risk": "calculate-risk",
  "/project-manager/view-risk-details": "view-risk-details",
  "/project-manager/project-crashing": "project-crashing",
  "/project-manager/reports": "reports",
  "/project-manager/profile": "profile",
};

function ProjectManagerDashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { pathname } = useLocation();

  // Full-page project form sub-routes (new / edit/:id) live inside the Projects section
  const activeSection = pathname.startsWith("/project-manager/projects")
    ? "projects"
    : pathToSection[pathname] ?? "dashboard";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Dashboard data ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    upcomingDeadlines: 0,
    activeInProgress: 0,
  });

  const [statusData, setStatusData] = useState({
    notStarted: 0, inProgress: 0, completed: 0,
  });

  const [activityData, setActivityData] = useState({
    completed: 0, inProgress: 0, notStarted: 0,
  });

  const [progressData, setProgressData] = useState([]);

  const [riskData, setRiskData] = useState([]);

  useEffect(() => {
    // Only fetch when on the dashboard section
    if (activeSection !== "dashboard") return;

    async function fetchAll() {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        // Single consolidated API call
        const res = await fetch(`${API_BASE}/api/pm/dashboard/consolidated`, { headers });
        if (res.ok) {
          const json = await res.json();

          // ── Cards — top-level fields ──────────────────────────────────
          setStats({
            totalProjects:      json.totalProjects      ?? 0,
            activeProjects:     json.activeProjects     ?? 0,
            completedProjects:  json.completedProjects  ?? 0,
            upcomingDeadlines:  json.upcomingDeadlines  ?? 0,
            activeInProgress:   json.activitiesInProgress ?? 0,
          });

          // ── Pie chart — projectStatusDistribution is a plain object ───
          // e.g. { "IN_PROGRESS": 2, "COMPLETED": 1, ... }
          if (json.projectStatusDistribution) {
            const s = json.projectStatusDistribution;
            setStatusData({
              notStarted: s.NOT_STARTED ?? 0,
              inProgress: s.IN_PROGRESS ?? 0,
              completed:  s.COMPLETED   ?? 0,
            });
          }

          // ── Activity Status bar — activityStatusDistribution ──────────
          if (json.activityStatusDistribution) {
            const a = json.activityStatusDistribution;
            setActivityData({
              completed:  a.COMPLETED   ?? 0,
              inProgress: a.IN_PROGRESS ?? 0,
              notStarted: a.NOT_STARTED ?? 0,
            });
          }

          // ── Project Progress — projectProgressList array ──────────────
          if (Array.isArray(json.projectProgressList)) {
            // Component expects { projectName, completion } or { projectName, completionPercentage }
            setProgressData(json.projectProgressList.map((p) => ({
              projectName:           p.projectName,
              completion:            p.completionPercentage ?? p.completion ?? 0,
              completionPercentage:  p.completionPercentage ?? p.completion ?? 0,
            })));
          }

          // ── Risk Overview — supports array [{riskLevel, projectCount}] ──
          //    or nested object { lowRiskCount, mediumRiskCount, ... }
          if (json.riskOverview) {
            if (Array.isArray(json.riskOverview)) {
              setRiskData(json.riskOverview);
            } else {
              const r = json.riskOverview;
              setRiskData([
                { name: "Low Risk",       value: r.lowRiskCount      ?? r.lowRisk      ?? 0 },
                { name: "Medium Risk",    value: r.mediumRiskCount   ?? r.mediumRisk   ?? 0 },
                { name: "High Risk",      value: r.highRiskCount     ?? r.highRisk     ?? 0 },
                { name: "Very High Risk", value: r.criticalRiskCount ?? r.veryHighRiskCount ?? r.veryHighRisk ?? 0 },
              ]);
            }
          }
        } else {
          console.error("[PM Dashboard] consolidated API failed:", res.status);
        }

      } catch (err) {
        console.error("[PM Dashboard] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "projects":
        return <ManagerProjects />;

      case "activities":
        return <ManagerActivities />;

      case "dependencies":
        return (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-800">Dependencies</h2>
            <p className="mt-2 text-gray-500">Dependency mapping will appear here.</p>
          </div>
        );

      case "pert-analysis":
        return <PertAnalysis />;

      case "risk-assessment":
        return <ManagerRiskAssessment />;

      case "project-crashing":
        return <ManagerProjectCrashing />;

      case "reports":
        return (
          <div className="p-2">
            <ManagerReports />
          </div>
        );

      case "profile":
        return <ManagerProfile />;

      default:
        return (
          <div className="space-y-6">

            {/* Cards — Admin-style summary cards */}
            <Cards stats={stats} loading={loading} />

            {/* Pie + Activity Status */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PieCharts statusData={statusData} loading={loading} />
              <ActivityStatus activityData={activityData} loading={loading} />
            </div>

            {/* Project Progress + Risk Overview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProjectProgress progressData={progressData} loading={loading} />
              <RiskOverview riskData={riskData} loading={loading} />
            </div>

          </div>
        );
    }
  };

  return (
    <div className="relative bg-white min-h-screen">
      <ManagerSidebar
        open={open}
        setOpen={setOpen}
        activeSection={activeSection}
      />

      <main
        style={{ "--sidebar-w": open ? "16rem" : "5rem" }}
        className={`relative z-10 flex-1 transition-all duration-300 p-6 lg:p-8 ${open ? "ml-64" : "ml-20"}`}
      >
        {/* Top bar is shown only on the Dashboard section */}
        {activeSection === "dashboard" && (
          <div className="mb-6">
            <TopBar
              title={<>Project Manager <span className="bg-[linear-gradient(92deg,#22d3ee_0%,#3b82f6_100%)] bg-clip-text text-transparent">Workspace</span></>}
              subtitle={`${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Welcome back`}
              userName="Project Manager"
              userRole="R&D Control Center"
              profilePath="/project-manager/profile"
              onLogout={handleLogout}
            />
          </div>
        )}
        <div key={activeSection} className="animate-[pageTurn_0.35s_ease-out]">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export default ProjectManagerDashboard;