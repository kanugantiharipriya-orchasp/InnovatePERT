package com.innovatepert.dto;
public class DashboardCardsDTO {

    private long totalProjects;
    private long activeProjects;
    private long totalProjectManagers;
    private long projectsAtRisk;

    public DashboardCardsDTO() {
    }

    public DashboardCardsDTO(long totalProjects,
                             long activeProjects,
                             long totalProjectManagers,
                             long projectsAtRisk) {
        this.totalProjects = totalProjects;
        this.activeProjects = activeProjects;
        this.totalProjectManagers = totalProjectManagers;
        this.projectsAtRisk = projectsAtRisk;
    }

    public long getTotalProjects() {
        return totalProjects;
    }

    public void setTotalProjects(long totalProjects) {
        this.totalProjects = totalProjects;
    }

    public long getActiveProjects() {
        return activeProjects;
    }

    public void setActiveProjects(long activeProjects) {
        this.activeProjects = activeProjects;
    }

    public long getTotalProjectManagers() {
        return totalProjectManagers;
    }

    public void setTotalProjectManagers(long totalProjectManagers) {
        this.totalProjectManagers = totalProjectManagers;
    }

    public long getProjectsAtRisk() {
        return projectsAtRisk;
    }

    public void setProjectsAtRisk(long projectsAtRisk) {
        this.projectsAtRisk = projectsAtRisk;
    }
}