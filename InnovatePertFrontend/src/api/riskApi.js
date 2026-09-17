import axios from "axios";

const riskApi = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================
// Project APIs
// =======================

export const getAllProjects = () => {
  return riskApi.get("/api/v1/projects");
};

// =======================
// Activity APIs
// =======================

export const getActivitiesByProject = (projectId) => {
  return riskApi.get(`/api/v1/activities/project/${projectId}`);
};

// =======================
// Risk APIs
// =======================

export const saveRiskAnalysis = (data) => {
  return riskApi.post("/risk-analysis", data);
};

export const getRiskHistory = () => {
  return riskApi.get("/risk-analysis");
};

export const getRiskAnalysisByProject = (projectId) => {
  return riskApi.get(`/risk-analysis/${projectId}`);
};

export default riskApi;