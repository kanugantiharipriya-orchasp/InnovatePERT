import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authHeader;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const projectService = {
  // 1. Existing assign project method
  assignProject: async (projectData) => {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error;
        throw new Error(serverMessage || 'Failed to assign project');
      }
      throw new Error('Failed to assign project');
    }
  },

  // 2. NEW METHOD: Fetch all projects from Spring Boot
  getAllProjects: async () => {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error;
        throw new Error(serverMessage || 'Failed to fetch projects');
      }
      throw new Error('Failed to fetch projects');
    }
  },

  transferProject: async (projectId, newPmUserId) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}/transfer`, null, {
        params: { newPmUserId }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error;
        throw new Error(serverMessage || 'Failed to transfer project');
      }
      throw new Error('Failed to transfer project');
    }
  }
};