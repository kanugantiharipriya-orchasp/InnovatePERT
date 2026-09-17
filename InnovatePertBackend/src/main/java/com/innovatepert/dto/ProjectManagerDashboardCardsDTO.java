package com.innovatepert.dto;

public class ProjectManagerDashboardCardsDTO {

    private long totalProjects;

    private long activeProjects;

    private long completedProjects;

    private long upcomingDeadlines;

    private long activitiesInProgress;


    public ProjectManagerDashboardCardsDTO() {
    }


    public ProjectManagerDashboardCardsDTO(
            long totalProjects,
            long activeProjects,
            long completedProjects,
            long upcomingDeadlines,
            long activitiesInProgress) {

        this.totalProjects = totalProjects;
        this.activeProjects = activeProjects;
        this.completedProjects = completedProjects;
        this.upcomingDeadlines = upcomingDeadlines;
        this.activitiesInProgress = activitiesInProgress;
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


    public long getCompletedProjects() {
        return completedProjects;
    }


    public void setCompletedProjects(long completedProjects) {
        this.completedProjects = completedProjects;
    }


    public long getUpcomingDeadlines() {
        return upcomingDeadlines;
    }


    public void setUpcomingDeadlines(long upcomingDeadlines) {
        this.upcomingDeadlines = upcomingDeadlines;
    }


    public long getActivitiesInProgress() {
        return activitiesInProgress;
    }


    public void setActivitiesInProgress(long activitiesInProgress) {
        this.activitiesInProgress = activitiesInProgress;
    }
}