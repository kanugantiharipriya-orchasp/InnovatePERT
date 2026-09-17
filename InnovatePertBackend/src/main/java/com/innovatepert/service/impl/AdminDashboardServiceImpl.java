package com.innovatepert.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.innovatepert.dto.AdminDashboardResponse;
import com.innovatepert.dto.AdminDashboardSummaryResponse;
import com.innovatepert.dto.ProjectManagerPerformanceResponse;
import com.innovatepert.dto.ProjectPriorityResponse;
import com.innovatepert.dto.ProjectStatusResponse;
import com.innovatepert.dto.RecentProjectResponse;
import com.innovatepert.dto.RiskOverviewResponse;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.User;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.enums.Role;
import com.innovatepert.exception.ResourceNotFoundException;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.DependencyRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.AdminDashboardService;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DependencyRepository dependencyRepository;

    public AdminDashboardServiceImpl(ProjectRepository projectRepository,
                                     UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    private User getLoggedInAdmin() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("Unauthorized: You must be logged in as an Admin.");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated Admin not found with email: " + email));
    }

    // ===========================
    // Dashboard Summary
    // ===========================

    @Override
    public AdminDashboardSummaryResponse getDashboardSummary() {
        User admin = getLoggedInAdmin();
        AdminDashboardSummaryResponse response = new AdminDashboardSummaryResponse();

        response.setTotalProjects(projectRepository.countProjectsByAdmin(admin));
        response.setActiveProjects(projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.IN_PROGRESS));
        response.setTotalProjectManagers(userRepository.countByRoleAndCreatedByAdmin(Role.PROJECT_MANAGER, admin));
        response.setProjectsAtRisk(projectRepository.countProjectsByAdminAtRisk(admin));

        return response;
    }

    // ===========================
    // Project Status
    // ===========================

    @Override
    public List<ProjectStatusResponse> getProjectStatus() {
        User admin = getLoggedInAdmin();
        return List.of(
                new ProjectStatusResponse("NOT_STARTED", projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.NOT_STARTED)),
                new ProjectStatusResponse("IN_PROGRESS", projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.IN_PROGRESS)),
                new ProjectStatusResponse("COMPLETED", projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.COMPLETED))
        );
    }

    // ===========================
    // Project Priority
    // ===========================

    @Override
    public List<ProjectPriorityResponse> getProjectPriority() {
        User admin = getLoggedInAdmin();
        return List.of(
                new ProjectPriorityResponse("HIGH", projectRepository.countProjectsByAdminAndPriority(admin, Priority.HIGH)),
                new ProjectPriorityResponse("MEDIUM", projectRepository.countProjectsByAdminAndPriority(admin, Priority.MEDIUM)),
                new ProjectPriorityResponse("LOW", projectRepository.countProjectsByAdminAndPriority(admin, Priority.LOW))
        );
    }

    // ===========================
    // Risk Overview
    // ===========================

    @Override
    public List<RiskOverviewResponse> getRiskOverview() {
        User admin = getLoggedInAdmin();
        return List.of(
                new RiskOverviewResponse("HIGH RISK", projectRepository.countProjectsByAdminAtRisk(admin)),
                new RiskOverviewResponse("MEDIUM RISK", projectRepository.countProjectsByAdminRiskLevel(admin, 50.0, 80.0)),
                new RiskOverviewResponse("LOW RISK", projectRepository.countProjectsByAdminRiskLevelMin(admin, 80.0))
        );
    }

    // ===========================
    // Recent Projects
    // ===========================

    @Override
    public List<RecentProjectResponse> getRecentProjects() {
        User admin = getLoggedInAdmin();
        return projectRepository
                .findRecentProjectsByAdmin(admin, PageRequest.of(0, 5))
                .stream()
                .map(project -> {
                    RecentProjectResponse response = new RecentProjectResponse();
                    response.setProjectId(project.getProjectId());
                    response.setProjectName(project.getProjectName());

                    if (project.getAssignedTo() != null) {
                        response.setProjectManagerName(project.getAssignedTo().getFullName());
                    } else {
                        response.setProjectManagerName("Not Assigned");
                    }

                    response.setTargetDate(project.getTargetDate());
                    response.setStatus(project.getStatus() != null ? project.getStatus().name() : "IN_PROGRESS");

                    long totalAct = activityRepository.countByProject(project);
                    long compAct = activityRepository.countByProjectAndStatus(project, ActivityStatus.COMPLETED);
                    double compPct = totalAct > 0 ? (double) compAct * 100.0 / totalAct : (project.getStatus() == ProjectStatus.COMPLETED ? 100.0 : 0.0);

                    response.setCompletionPercentage(project.getProjectProgress() != null ? project.getProjectProgress() : compPct);
                    response.setCompletionProbability(project.getCompletionProbability());

                    return response;
                })
                .toList();
    }

    // ===========================
    // Project Manager Performance
    // ===========================

    @Override
    public List<ProjectManagerPerformanceResponse> getProjectManagerPerformance() {
        User admin = getLoggedInAdmin();
        List<User> managers = userRepository.findByRoleAndCreatedByAdmin(Role.PROJECT_MANAGER, admin);

        return managers.stream().map(manager -> {
            ProjectManagerPerformanceResponse response = new ProjectManagerPerformanceResponse();
            response.setManagerName(manager.getFullName());
            response.setTotalProjects(projectRepository.countByAssignedTo(manager));
            response.setCompletedProjects(projectRepository.countByAssignedToAndStatus(manager, ProjectStatus.COMPLETED));
            response.setInProgressProjects(projectRepository.countByAssignedToAndStatus(manager, ProjectStatus.IN_PROGRESS));
            response.setNotStartedProjects(projectRepository.countByAssignedToAndStatus(manager, ProjectStatus.NOT_STARTED));

            return response;
        }).toList();
    }

    // ===========================
    // Complete Dashboard
    // ===========================

    @Override
    public AdminDashboardResponse getDashboard() {
        return new AdminDashboardResponse();
    }

    @Override
    public com.innovatepert.dto.ConsolidatedAdminDashboardDTO getConsolidatedDashboard() {
        User admin = getLoggedInAdmin();
        List<Project> adminProjects = projectRepository.findProjectsByAdmin(admin);

        long totalProjects = projectRepository.countProjectsByAdmin(admin);
        long activeProjects = projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.IN_PROGRESS);
        long completedProjects = projectRepository.countProjectsByAdminAndStatus(admin, ProjectStatus.COMPLETED);
        long totalPMs = userRepository.countByRoleAndCreatedByAdmin(Role.PROJECT_MANAGER, admin);
        long projectsAtRisk = projectRepository.countProjectsByAdminAtRisk(admin);

        long totalActivities = adminProjects.isEmpty() ? 0L : activityRepository.countByProjectIn(adminProjects);
        long totalDependencies = adminProjects.isEmpty() ? 0L : dependencyRepository.countByProjectIn(adminProjects);

        Map<String, Long> statusMap = new HashMap<>();
        for (ProjectStatus status : ProjectStatus.values()) {
            statusMap.put(status.name(), projectRepository.countProjectsByAdminAndStatus(admin, status));
        }

        Map<String, Long> priorityMap = new HashMap<>();
        for (Priority priority : Priority.values()) {
            priorityMap.put(priority.name(), projectRepository.countProjectsByAdminAndPriority(admin, priority));
        }

        long lowRisk = projectRepository.countProjectsByAdminRiskLevelMin(admin, 80.0);
        long mediumRisk = projectRepository.countProjectsByAdminRiskLevel(admin, 50.0, 80.0);
        long highRisk = projectRepository.countProjectsByAdminAtRisk(admin);

        com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminRiskSummary riskSummary =
                com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminRiskSummary.builder()
                        .totalRisks(totalProjects)
                        .openRisks(highRisk)
                        .mitigatedRisks(mediumRisk)
                        .closedRisks(lowRisk)
                        .lowRiskCount(lowRisk)
                        .mediumRiskCount(mediumRisk)
                        .highRiskCount(highRisk)
                        .veryHighRiskCount(0L)
                        .build();

        com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminDependencySummary depSummary =
                com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminDependencySummary.builder()
                        .totalDependencies(totalDependencies)
                        .blockedProjectsCount(projectsAtRisk)
                        .readyToStartProjectsCount(activeProjects)
                        .completedDependenciesCount(completedProjects)
                        .build();

        long actCompleted = adminProjects.isEmpty() ? 0L : activityRepository.countByProjectInAndStatus(adminProjects, ActivityStatus.COMPLETED);
        long actInProgress = adminProjects.isEmpty() ? 0L : activityRepository.countByProjectInAndStatus(adminProjects, ActivityStatus.IN_PROGRESS);
        long actNotStarted = adminProjects.isEmpty() ? 0L : activityRepository.countByProjectInAndStatus(adminProjects, ActivityStatus.NOT_STARTED);

        com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminActivitySummary actSummary =
                com.innovatepert.dto.ConsolidatedAdminDashboardDTO.AdminActivitySummary.builder()
                        .totalActivities(totalActivities)
                        .completedActivities(actCompleted)
                        .inProgressActivities(actInProgress)
                        .notStartedActivities(actNotStarted)
                        .overdueActivities(0L)
                        .build();

        return com.innovatepert.dto.ConsolidatedAdminDashboardDTO.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .projectsAtRisk(projectsAtRisk)
                .totalProjectManagers(totalPMs)
                .totalActivities(totalActivities)
                .totalRisks(totalProjects)
                .blockedProjectsCount(projectsAtRisk)
                .statusDistribution(statusMap)
                .priorityDistribution(priorityMap)
                .riskOverview(riskSummary)
                .dependencyInsights(depSummary)
                .activityOverview(actSummary)
                .recentProjects(getRecentProjects())
                .managerPerformance(getProjectManagerPerformance())
                .build();
    }
}