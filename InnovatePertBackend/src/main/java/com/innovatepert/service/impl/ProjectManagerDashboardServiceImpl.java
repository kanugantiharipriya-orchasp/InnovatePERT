package com.innovatepert.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovatepert.dto.ActivityStatusResponse;
import com.innovatepert.dto.ConsolidatedPMDashboardDTO;
import com.innovatepert.dto.ProjectManagerDashboardCardsDTO;
import com.innovatepert.dto.ProjectProgressResponse;
import com.innovatepert.dto.ProjectStatusResponse;
import com.innovatepert.dto.RiskOverviewResponse;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.User;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.service.ProjectManagerDashboardService;

@Service
public class ProjectManagerDashboardServiceImpl implements ProjectManagerDashboardService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ActivityRepository activityRepository;

    // 1. Dashboard Cards API
    @Override
    public ProjectManagerDashboardCardsDTO getDashboardCards() {
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.IN_PROGRESS);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long upcomingDeadlines = projectRepository.countUpcomingDeadlines();
        long activitiesInProgress = activityRepository.countByStatus(ActivityStatus.IN_PROGRESS);

        return new ProjectManagerDashboardCardsDTO(
                totalProjects, activeProjects, completedProjects, upcomingDeadlines, activitiesInProgress
        );
    }

    // 2. Project Status API
    @Override
    public List<ProjectStatusResponse> getProjectStatus() {
        List<ProjectStatusResponse> response = new ArrayList<>();
        for(ProjectStatus status : ProjectStatus.values()) {
            response.add(new ProjectStatusResponse(status.name(), projectRepository.countByStatus(status)));
        }
        return response;
    }

    // 3. Activity Status API
    @Override
    public List<ActivityStatusResponse> getActivityStatus() {
        List<ActivityStatusResponse> response = new ArrayList<>();
        for(ActivityStatus status : ActivityStatus.values()) {
            response.add(new ActivityStatusResponse(status.name(), activityRepository.countByStatus(status)));
        }
        return response;
    }

    // 4. Project Progress API
    @Override
    public List<ProjectProgressResponse> getProjectProgress() {
        return projectRepository.findAll().stream()
                .map(p -> new ProjectProgressResponse(
                        p.getProjectName(),
                        p.getCompletionProbability() != null ? p.getCompletionProbability().intValue() : 0))
                .collect(Collectors.toList());
    }

    // 5. Unified Global Risk Overview
    @Override
    public List<RiskOverviewResponse> getRiskOverview() {
        List<RiskOverviewResponse> response = new ArrayList<>();

        // Using GreaterThan and Between to match existing repository methods
        long lowRisk = projectRepository.countByCompletionProbabilityGreaterThan(79.99);
        long mediumRisk = projectRepository.countByCompletionProbabilityBetween(50.0, 79.99);
        long highRisk = projectRepository.countByCompletionProbabilityLessThan(50.0);

        response.add(new RiskOverviewResponse("Low Schedule Risk (>=80% Confidence)", lowRisk));
        response.add(new RiskOverviewResponse("Medium Schedule Risk (50%-79% Confidence)", mediumRisk));
        response.add(new RiskOverviewResponse("High Schedule Risk (<50% Confidence)", highRisk));

        return response;
    }

    // ==========================================
    // Unified Scoped PM Dashboard Implementation
    // ==========================================

    @Override
    public ConsolidatedPMDashboardDTO getConsolidatedDashboard(User manager) {
        List<Project> pmProjects = (manager != null)
                ? projectRepository.findByAssignedTo(manager)
                : List.of();

        long totalProjects = pmProjects.size();
        long activeProjects = pmProjects.stream().filter(p -> p.getStatus() == ProjectStatus.IN_PROGRESS).count();
        long completedProjects = pmProjects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();

        LocalDate today = LocalDate.now();
        long upcomingDeadlines = pmProjects.stream()
                .filter(p -> p.getTargetDate() != null && !p.getTargetDate().isBefore(today) && p.getStatus() != ProjectStatus.COMPLETED)
                .count();

        // Status Map
        Map<String, Long> pStatusMap = new HashMap<>();
        for (ProjectStatus s : ProjectStatus.values()) {
            pStatusMap.put(s.name(), pmProjects.stream().filter(p -> p.getStatus() == s).count());
        }

        // Activity Breakdown
        long totalActivities = (manager != null) ? activityRepository.countByProject_AssignedTo(manager) : 0L;
        long actInProgress = (manager != null) ? activityRepository.countByProject_AssignedToAndStatus(manager, ActivityStatus.IN_PROGRESS) : 0L;
        long actCompleted = (manager != null) ? activityRepository.countByProject_AssignedToAndStatus(manager, ActivityStatus.COMPLETED) : 0L;
        long actNotStarted = (manager != null) ? activityRepository.countByProject_AssignedToAndStatus(manager, ActivityStatus.NOT_STARTED) : 0L;

        Map<String, Long> actStatusMap = new HashMap<>();
        actStatusMap.put("NOT_STARTED", actNotStarted);
        actStatusMap.put("IN_PROGRESS", actInProgress);
        actStatusMap.put("COMPLETED", actCompleted);
        actStatusMap.put("OVERDUE", 0L);

        // Project Progress Items
        List<ConsolidatedPMDashboardDTO.PMProjectProgressItem> progressItems = pmProjects.stream()
                .map(p -> {
                    String rLevel = "LOW";
                    Double prob = p.getCompletionProbability() != null ? p.getCompletionProbability() : 0.0;
                    if (prob < 50.0) rLevel = "HIGH";
                    else if (prob < 80.0) rLevel = "MEDIUM";

                    String depStatus = "ON_TRACK";
                    if (prob < 50.0) depStatus = "SCHEDULE_AT_RISK"; 
                    if (p.getStatus() == ProjectStatus.COMPLETED) depStatus = "COMPLETED";

                    long totalAct = activityRepository.countByProject(p);
                    long compAct = activityRepository.countByProjectAndStatus(p, ActivityStatus.COMPLETED);
                    double compPct = totalAct > 0 ? (double) compAct * 100.0 / totalAct : (p.getStatus() == ProjectStatus.COMPLETED ? 100.0 : 0.0);

                    return ConsolidatedPMDashboardDTO.PMProjectProgressItem.builder()
                            .projectId(p.getProjectId())
                            .projectName(p.getProjectName())
                            .status(p.getStatus() != null ? p.getStatus().name() : "NOT_STARTED")
                            .priority(p.getPriority() != null ? p.getPriority().name() : "MEDIUM")
                            .completionPercentage(compPct)
                            .completionProbability(prob)
                            .riskLevel(rLevel)
                            .targetDate(p.getTargetDate() != null ? p.getTargetDate().toString() : "N/A")
                            .budget(p.getBudget() != null ? p.getBudget().doubleValue() : 0.0)
                            .dependencyStatus(depStatus)
                            .build();
                })
                .collect(Collectors.toList());

        long lowRiskCount = pmProjects.stream().filter(p -> p.getCompletionProbability() != null && p.getCompletionProbability() >= 80.0).count();
        long medRiskCount = pmProjects.stream().filter(p -> p.getCompletionProbability() != null && p.getCompletionProbability() >= 50.0 && p.getCompletionProbability() < 80.0).count();
        long highRiskCount = pmProjects.stream().filter(p -> p.getCompletionProbability() != null && p.getCompletionProbability() < 50.0).count();

        ConsolidatedPMDashboardDTO.PMRiskSummary riskSummary =
                ConsolidatedPMDashboardDTO.PMRiskSummary.builder()
                        .totalRisks(totalProjects) 
                        .openRisks(highRiskCount) 
                        .mitigatedRisks(medRiskCount) 
                        .closedRisks(lowRiskCount) 
                        .lowRiskCount(lowRiskCount)
                        .mediumRiskCount(medRiskCount)
                        .highRiskCount(highRiskCount)
                        .criticalRiskCount(0L) 
                        .build();

        ConsolidatedPMDashboardDTO.PMDependencySummary depSummary =
                ConsolidatedPMDashboardDTO.PMDependencySummary.builder()
                        .totalDependencies(totalProjects)
                        .blockedProjectsCount(0L) 
                        .readyToStartProjectsCount(activeProjects)
                        .waitingOnPrerequisitesCount(0L)
                        .build();

        return ConsolidatedPMDashboardDTO.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .upcomingDeadlines(upcomingDeadlines)
                .totalActivities(totalActivities)
                .activitiesInProgress(actInProgress)
                .activitiesCompleted(actCompleted)
                .overdueActivitiesCount(0L)
                .openRisksCount(highRiskCount)
                .blockedProjectsCount(0L) 
                .projectStatusDistribution(pStatusMap)
                .activityStatusDistribution(actStatusMap)
                .projectProgressList(progressItems)
                .riskOverview(riskSummary)
                .dependencyInsights(depSummary)
                .build();
    }
}