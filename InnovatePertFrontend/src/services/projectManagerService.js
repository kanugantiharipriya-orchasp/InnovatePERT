// File: src/services/projectManagerService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/project-managers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the JWT token from Login.jsx
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const projectManagerService = {
  create: async (managerData) => {
    try {
      const response = await apiClient.post('/create', managerData);
      return response.data;
    } catch (error) { throw handleApiError(error, 'Failed to create Project Manager'); }
  },
  getAll: async () => {
    try {
      const response = await apiClient.get('');
      return response.data;
    } catch (error) { throw handleApiError(error, 'Failed to fetch Project Managers'); }
  },
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error, 'Failed to fetch Project Manager'); }
  },
  update: async (id, managerData) => {
    try {
      const response = await apiClient.put(`/${id}`, managerData);
      return response.data;
    } catch (error) { throw handleApiError(error, 'Failed to update details'); }
  },
  deactivate: async (id) => {
  try {
    const response = await apiClient.patch(`/${id}/deactivate`);
    return response.data;
  } catch (error) { 
    throw handleApiError(error, 'Failed to deactivate'); 
  }
},

activate: async (id) => {
  try {
    const response = await apiClient.patch(`/${id}/activate`);
    return response.data;
  } catch (error) { 
    throw handleApiError(error, 'Failed to activate'); 
  }
},

  softDelete: async (id) => {
    try {
      const response = await apiClient.delete(`/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error, 'Failed to delete'); }
  },
  search: async (keyword) => {
    try {
      const response = await apiClient.get('/search', { params: { keyword } });
      return response.data;
    } catch (error) { throw handleApiError(error, 'Search failed'); }
  },
  filterByStatus: async (status) => {
    try {
      const response = await apiClient.get('/filter', { params: { status } });
      return response.data;
    } catch (error) { throw handleApiError(error, 'Filter failed'); }
  },

  uploadExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file); // Must match RequestParam("file") in Spring Boot

      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, "Failed to upload Excel file");
    }
  },
  
  downloadTemplate: async () => {
    try {
      const response = await apiClient.get('/upload/template', {
        responseType: 'blob', // Important for file download
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to download template');
    }
  }
};

function handleApiError(error, defaultMessage) {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    const err = new Error(serverMessage || error.message || defaultMessage);
    if (error.response?.data?.fieldErrors) {
      err.fieldErrors = error.response.data.fieldErrors;
    }
    return err;
  }
  return new Error(defaultMessage);
}