
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Homepage from "./pages/Homepage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProfile from "./pages/Admin/AdminProfile";
import ProjectManagers from "./pages/Admin/ProjectManagers";
import Reports from "./pages/Admin/AdminReports";
import ProjectManagerDashboard from "./pages/Manager/ProjectManagerDashboard";
import Projects from "./pages/Admin/AdminProjects";
import AdminRiskAnalysis from "./pages/Admin/AdminRiskAnalysis";

// Checks if the user is logged in and has the right role
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");

  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />

        {/* ─────────── Admin Routes ─────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/project-managers"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <ProjectManagers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/risk-analysis"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminRiskAnalysis />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/admin-profile"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* ─────────── Project Manager Routes ─────────── */}

        <Route
          path="/project-manager/dashboard"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/projects"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/projects/new"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/projects/edit/:id"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/activities"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/dependencies"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/pert-analysis"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/risk-assessment"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/project-crashing"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/reports"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-manager/profile"
          element={
            <ProtectedRoute allowedRole="PROJECT_MANAGER">
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
