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
public class ConsolidatedPMDashboardDTO {

    // PM Summary Cards
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long upcomingDeadlines;
    private long totalActivities;
    private long activitiesInProgress;
    private long activitiesCompleted;
    private long overdueActivitiesCount;
    private long openRisksCount;
    private long blockedProjectsCount;

    // PM Project Status Distribution
    private Map<String, Long> projectStatusDistribution;

    // PM Activity Status Distribution
    private Map<String, Long> activityStatusDistribution;

    // PM Projects Progress Details (with dynamic completion %, PERT probability, dependency status)
    private List<PMProjectProgressItem> projectProgressList;

    // PM Risk Severity Breakdown
    private PMRiskSummary riskOverview;

    // PM Dependency Insights
    private PMDependencySummary dependencyInsights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PMProjectProgressItem {
        private Integer projectId;
        private String projectName;
        private String status;
        private String priority;
        private Double completionPercentage;
        private Double completionProbability;
        private String riskLevel;
        private String targetDate;
        private Double budget;
        private String dependencyStatus; // "BLOCKED", "READY", "IN_PROGRESS", "COMPLETED"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PMRiskSummary {
        private long totalRisks;
        private long openRisks;
        private long mitigatedRisks;
        private long closedRisks;
        private long lowRiskCount;
        private long mediumRiskCount;
        private long highRiskCount;
        private long criticalRiskCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PMDependencySummary {
        private long totalDependencies;
        private long blockedProjectsCount;
        private long readyToStartProjectsCount;
        private long waitingOnPrerequisitesCount;
    }
}
