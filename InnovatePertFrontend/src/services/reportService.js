import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/v1";

// Helper to construct authorization headers from stored token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    },
    withCredentials: true
  };
};

export const reportService = {
  // Fetch list of enterprise projects
  getProjects: async () => {
    const response = await axios.get(`${API_BASE_URL}/projects`, getAuthHeaders());
    return response.data;
  },

  // Fetch project manager metrics table preview data
  getManagerReportData: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/reports/project-managers/preview`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Fetch Complete Project report JSON for metrics / preview
  getCompleteProjectData: async (projectId) => {
    const response = await axios.get(
      `${API_BASE_URL}/reports/complete-project/preview`,
      {
        params: { projectId },
        ...getAuthHeaders()
      }
    );
    return response.data;
  },

  // Download Project Manager Reports (PDF or Excel)
  downloadManagerReport: async (format) => {
    const endpoint = format === "excel" ? "xlsx" : "pdf";
    const response = await axios.get(
      `${API_BASE_URL}/reports/project-managers/download/${endpoint}`,
      {
        responseType: "blob",
        ...getAuthHeaders()
      }
    );
    return response.data;
  },

  // Download Complete Project Reports (PDF or Excel)
  downloadCompleteProjectReport: async (projectId, format) => {
    const endpoint = format === "excel" ? "xlsx" : "pdf";
    const response = await axios.get(
      `${API_BASE_URL}/reports/complete-project/download/${endpoint}`,
      {
        params: { projectId },
        responseType: "blob",
        ...getAuthHeaders()
      }
    );
    return response.data;
  },

  // Download Single Project Risk Assessment Reports (PDF or Excel)
  downloadRiskAssessmentReport: async (projectId, format) => {
    const endpoint = format === "excel" ? "xlsx" : "pdf";
    const response = await axios.get(
      `${API_BASE_URL}/reports/risk-assessment/download/${endpoint}`,
      {
        params: { projectId },
        responseType: "blob",
        ...getAuthHeaders()
      }
    );
    return response.data;
  },

  // Download Single Project Crashing Reports (PDF or Excel)
  downloadCrashingReport: async (projectId, format) => {
    const endpoint = format === "excel" ? "xlsx" : "pdf";
    const response = await axios.get(
      `${API_BASE_URL}/reports/project-crashing/download/${endpoint}`,
      {
        params: { projectId },
        responseType: "blob",
        ...getAuthHeaders()
      }
    );
    return response.data;
  }
};