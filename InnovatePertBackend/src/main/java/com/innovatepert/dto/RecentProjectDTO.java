package com.innovatepert.dto;

public class RecentProjectDTO {

    private Integer projectId;
    private String projectName;
    private String projectManager;
    private String status;
    private String priority;

    public RecentProjectDTO() {
    }

    public RecentProjectDTO(Integer projectId,
                            String projectName,
                            String projectManager,
                            String status,
                            String priority) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.projectManager = projectManager;
        this.status = status;
        this.priority = priority;
    }

    public Integer getProjectId() {
        return projectId;
    }

    public void setProjectId(Integer projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getProjectManager() {
        return projectManager;
    }

    public void setProjectManager(String projectManager) {
        this.projectManager = projectManager;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}