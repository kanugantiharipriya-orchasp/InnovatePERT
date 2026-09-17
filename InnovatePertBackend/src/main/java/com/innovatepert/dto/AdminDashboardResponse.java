package com.innovatepert.dto;

import java.util.List;

public class AdminDashboardResponse {

    private DashboardCardsDTO dashboardCards;

    private ProjectStatusDTO projectStatus;

    private PriorityDistributionDTO priorityDistribution;

    private RiskOverviewDTO riskOverview;

    private List<RecentProjectDTO> recentProjects;

    private List<ProjectManagerPerformanceDTO> projectManagerPerformance;

    public AdminDashboardResponse() {
    }

    public DashboardCardsDTO getDashboardCards() {
        return dashboardCards;
    }

    public void setDashboardCards(DashboardCardsDTO dashboardCards) {
        this.dashboardCards = dashboardCards;
    }

    public ProjectStatusDTO getProjectStatus() {
        return projectStatus;
    }

    public void setProjectStatus(ProjectStatusDTO projectStatus) {
        this.projectStatus = projectStatus;
    }

    public PriorityDistributionDTO getPriorityDistribution() {
        return priorityDistribution;
    }

    public void setPriorityDistribution(PriorityDistributionDTO priorityDistribution) {
        this.priorityDistribution = priorityDistribution;
    }

    public RiskOverviewDTO getRiskOverview() {
        return riskOverview;
    }

    public void setRiskOverview(RiskOverviewDTO riskOverview) {
        this.riskOverview = riskOverview;
    }

    public List<RecentProjectDTO> getRecentProjects() {
        return recentProjects;
    }

    public void setRecentProjects(List<RecentProjectDTO> recentProjects) {
        this.recentProjects = recentProjects;
    }

    public List<ProjectManagerPerformanceDTO> getProjectManagerPerformance() {
        return projectManagerPerformance;
    }

    public void setProjectManagerPerformance(List<ProjectManagerPerformanceDTO> projectManagerPerformance) {
        this.projectManagerPerformance = projectManagerPerformance;
    }

}