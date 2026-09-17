package com.innovatepert.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsolidatedAdminDashboardDTO {

    // Summary Cards Metrics
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long projectsAtRisk;
    private long totalProjectManagers;
    private long totalActivities;
    private long totalRisks;
    private long blockedProjectsCount;

    // Categorized Distributions
    private Map<String, Long> statusDistribution;
    private Map<String, Long> priorityDistribution;

    // Risk Overview Statistics
    private AdminRiskSummary riskOverview;

    // Dependency Insights
    private AdminDependencySummary dependencyInsights;

    // Activity Overview
    private AdminActivitySummary activityOverview;

    // Recent Projects List
    private List<RecentProjectResponse> recentProjects;

    // Manager Performance Breakdown
    private List<ProjectManagerPerformanceResponse> managerPerformance;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminRiskSummary {
        private long totalRisks;
        private long openRisks;
        private long mitigatedRisks;
        private long closedRisks;
        private long lowRiskCount;
        private long mediumRiskCount;
        private long highRiskCount;
        private long veryHighRiskCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDependencySummary {
        private long totalDependencies;
        private long blockedProjectsCount;
        private long readyToStartProjectsCount;
        private long completedDependenciesCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminActivitySummary {
        private long totalActivities;
        private long completedActivities;
        private long inProgressActivities;
        private long notStartedActivities;
        private long overdueActivities;
    }
}
