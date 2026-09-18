import axios from 'axios';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Axios Instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/pm`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwtToken");

    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const pertService = {

  /**
   * Calculate/Generate PERT Analysis for a Project
   * POST /api/pm/projects/{projectId}/calculate
   */
  async generatePertAnalysis(projectId) {
    try {
      const response = await apiClient.post(`/projects/${projectId}/calculate`);
      return response.data;
    } catch (error) {
      console.error("Error generating PERT Analysis", error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          "Failed to generate PERT Analysis"
        );
      }

      throw error;
    }
  },

  /**
   * Get PERT Results for a Project
   * GET /api/pm/projects/{projectId}
   */
  async getPertResultsByProject(projectId) {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching PERT Results", error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          "Failed to fetch PERT Results"
        );
      }

      throw error;
    }
  },

  /**
   * Get Single Activity PERT Result
   * GET /api/pm/projects/{projectId}/activities/{activityId}
   */
  async getPertResultByActivity(projectId, activityId) {
    try {
      const response = await apiClient.get(
        `/projects/${projectId}/activities/${activityId}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching Activity PERT", error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          "Failed to fetch Activity PERT"
        );
      }

      throw error;
    }
  },

  /**
   * Delete PERT Results
   * DELETE /api/pm/projects/{projectId}
   */
  async deletePertResults(projectId) {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting PERT Results", error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          "Failed to delete PERT Results"
        );
      }

      throw error;
    }
  },
};

export default pertService;