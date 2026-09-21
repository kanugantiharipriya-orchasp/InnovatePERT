import { useNavigate } from "react-router-dom";
import {
  FaChevronLeft,
  FaHome,
  FaProjectDiagram,
  FaTasks,
  FaLink,
  FaChartLine,
  FaExclamationTriangle,
  FaBolt,
  FaFileAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaUserTie,
} from "react-icons/fa";

function ManagerSidebar({ open, setOpen, activeSection }) {
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard",          title: "Dashboard",        icon: <FaHome />,                path: "/project-manager/dashboard" },
    { id: "projects",           title: "Projects",         icon: <FaProjectDiagram />,      path: "/project-manager/projects" },
    { id: "activities",         title: "Activities",       icon: <FaTasks />,               path: "/project-manager/activities" },
    // { id: "dependencies",       title: "Dependencies",     icon: <FaLink />,                path: "/project-manager/dependencies" },
    { id: "pert-analysis",      title: "PERT Analysis",    icon: <FaChartLine />,           path: "/project-manager/pert-analysis" },
    { id: "risk-assessment",    title: "Risk Assessment",  icon: <FaExclamationTriangle />, path: "/project-manager/risk-assessment" },
    { id: "project-crashing",   title: "Project Crashing", icon: <FaBolt />,                path: "/project-manager/project-crashing" },
    { id: "reports",            title: "Reports",          icon: <FaFileAlt />,             path: "/project-manager/reports" },
    { id: "profile",            title: "Profile",          icon: <FaUserCircle />,          path: "/project-manager/profile" },
  ];

  const logout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen flex-col transition-all duration-300
          bg-white border-r border-slate-200 shadow-2xl shadow-slate-200/50
          ${open ? "w-64 translate-x-0" : "-translate-x-full lg:w-20 lg:translate-x-0"}`}
      >
      {/* ── Collapse / expand toggle — floats on the sidebar's right edge ── */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        title={open ? "Collapse menu" : "Expand menu"}
        className={`absolute top-7 z-50 hidden lg:flex h-8 w-8 items-center justify-center rounded-full
          bg-white text-slate-500 border border-slate-200 shadow-md shadow-slate-200/70
          hover:text-cyan-600 hover:border-cyan-300 hover:shadow-cyan-200
          transition-all duration-300 cursor-pointer
          ${open ? "-right-3.5" : "-right-3.5 rotate-180"}`}
      >
        <FaChevronLeft size={12} />
      </button>

      {/* ── Logo ── */}
      <div className={`flex items-center pt-6 pb-5 ${open ? "gap-3 px-5" : "justify-center px-0"}`}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
          bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-700 text-white font-black text-base
          shadow-lg shadow-cyan-300/50">
          IP
          <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-md" />
        </div>
        {open && (
          <div className="overflow-hidden leading-tight">
            <p className="font-black text-slate-800 text-sm tracking-tight">
              Innovate<span className="bg-[linear-gradient(92deg,#22d3ee_0%,#3b82f6_100%)] bg-clip-text text-transparent">PERT</span>
            </p>
            <p className="text-[11px] text-slate-500">Project & Cost Crasher</p>
          </div>
        )}
      </div>

      {/* ── Section label ── */}
      {open && (
        <p className="px-6 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Main Menu
        </p>
      )}

      {/* ── Menu items ── */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-3">
        {menuItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              title={!open ? item.title : undefined}
              className={`group active:scale-95 relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm
                font-semibold transition-all duration-200 cursor-pointer
                ${active
                  ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 text-white shadow-lg shadow-cyan-300/40"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm"
                }
                ${!open ? "justify-center" : ""}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full" />
              )}
              <span className={`text-lg shrink-0 transition-colors
                ${active ? "text-white" : "text-slate-500 group-hover:text-cyan-600"}`}>
                {item.icon}
              </span>
              {open && <span>{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: identity + logout ── */}
      <div className="space-y-2 border-t border-slate-100/90 px-3 pt-4 pb-5">
        {/* {open ? (
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-gradient-to-br
            from-cyan-50 to-blue-50 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
              bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-200">
              <FaUserTie size={14} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-slate-800">Project Manager</p>
              <p className="truncate text-[10px] text-slate-500">R&D Control Center</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl
              bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-200"
              title="Project Manager">
              <FaUserTie size={14} />
            </div>
          </div>
        )} */}

        <button
          onClick={logout}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold
            text-rose-500 transition-all duration-200 cursor-pointer
            hover:bg-rose-50/80 hover:shadow-sm
            ${!open ? "justify-center" : ""}`}
          title={!open ? "Logout" : undefined}
        >
          <FaSignOutAlt className="text-lg shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
    </>
  );
}

export default ManagerSidebar;
