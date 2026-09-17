package com.innovatepert.service.impl;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.request.ActivityRequest;
import com.innovatepert.dto.response.ActivityResponse;
import com.innovatepert.dto.response.ProjectBudgetSummaryResponse;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Dependency;
import com.innovatepert.entity.Project;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.exception.ActivityAlreadyExistsException;
import com.innovatepert.exception.ActivityNotFoundException;
import com.innovatepert.exception.InvalidCostException;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.mapper.ActivityMapper;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.DependencyRepository;
import com.innovatepert.repository.PertResultRepository;
import com.innovatepert.repository.ProjectCrashingRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.ActivityService;
import com.innovatepert.entity.ProjectCrashing;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityServiceImpl implements ActivityService {

    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final ActivityMapper activityMapper;
    private final DependencyRepository dependencyRepository;
    private final UserRepository userRepository;
    private final PertResultRepository pertResultRepository;
    private final ProjectCrashingRepository projectCrashingRepository;

    @Override
    public ActivityResponse createActivity(ActivityRequest request) {

        // Fetch Project
        Project project = getProject(request.getProjectId());

        // Check Duplicate Activity Name
        validateDuplicateActivity(project, request.getActivityName());

        // Validate PERT Values
        validatePertValues(request);

        // Validate Cost Details
        validateCostDetails(request);

        // Validate Budget Allocation
        Double currentAllocated = activityRepository.sumNormalCostByProjectId(project.getProjectId());
        if (currentAllocated == null) currentAllocated = 0.0;
        Double projectBudget = project.getBudget() != null ? project.getBudget().doubleValue() : 0.0;
        Double remainingBudget = projectBudget - currentAllocated;

        if (request.getNormalCost() > remainingBudget) {
            throw new InvalidCostException(
                    String.format("Activity Normal Cost (₹%.2f) exceeds remaining project budget (₹%.2f). Total Project Budget: ₹%.2f, Currently Allocated: ₹%.2f.",
                            request.getNormalCost(), remainingBudget, projectBudget, currentAllocated));
        }

        // Calculate Expected Time
        Double expectedTime = calculateExpectedTime(
                request.getOptimisticTime(),
                request.getMostLikelyTime(),
                request.getPessimisticTime());

        // Validate Project Business Target Duration
        validateProjectTargetDuration(project, expectedTime, null);

        // Calculate Variance
        Double variance = calculateVariance(
                request.getOptimisticTime(),
                request.getPessimisticTime());

        // Convert Request DTO to Entity
        Activity activity = activityMapper.toEntity(request);

        // Set Project
        activity.setProject(project);

        // Set Calculated Values
        activity.setExpectedTime(expectedTime);
        activity.setVariance(variance);
        activity.setNormalTime(expectedTime);

        // Default Status
        activity.setStatus(ActivityStatus.NOT_STARTED);

        // Save Activity and Flush
        Activity savedActivity = activityRepository.saveAndFlush(activity);

        // Handle predecessor activity dependency if provided
        if (request.getPredecessorActivityId() != null) {
            Activity pred = activityRepository.findById(request.getPredecessorActivityId()).orElse(null);
            if (pred != null) {
                Dependency dep = Dependency.builder()
                        .project(project)
                        .predecessorActivity(pred)
                        .successorActivity(savedActivity)
                        .dependencyType("FS")
                        .build();
                dependencyRepository.saveAndFlush(dep);
            }
        }

        // Sync Project Completion Probability & Auto Completion Status
        syncProjectProgressAndStatus(project.getProjectId());

        // Return Response with predecessor metadata
        return enrichResponseWithPredecessor(activityMapper.toResponse(savedActivity), savedActivity);
    }

    private Project getProject(Integer projectId) {
        if (projectId == null) {
            throw new ProjectNotFoundException("Project ID cannot be null.");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ProjectNotFoundException("Project not found with id : " + projectId));
        verifyProjectAccess(project);
        return project;
    }

    private void verifyProjectAccess(Project project) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized: User not authenticated.");
        }
        String email = auth.getName();
        com.innovatepert.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.innovatepert.exception.ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == com.innovatepert.enums.Role.ADMIN) {
            boolean isAssignedBy = project.getAssignedBy() != null && project.getAssignedBy().getUserId().equals(user.getUserId());
            boolean isManagerCreatedByThisAdmin = project.getAssignedTo() != null &&
                    project.getAssignedTo().getCreatedByAdmin() != null &&
                    project.getAssignedTo().getCreatedByAdmin().getUserId().equals(user.getUserId());

            if (!isAssignedBy && !isManagerCreatedByThisAdmin) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access activities of projects outside your organization scope.");
            }
        } else if (user.getRole() == com.innovatepert.enums.Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null && project.getAssignedTo().getUserId().equals(user.getUserId());
            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access activities of unassigned projects.");
            }
        }
    }

    private void validateDuplicateActivity(Project project, String activityName) {
        if (activityRepository.existsByProjectAndActivityNameIgnoreCase(project, activityName)) {
            throw new ActivityAlreadyExistsException(
                    "Activity '" + activityName + "' already exists in this project.");
        }
    }

    private void validatePertValues(ActivityRequest request) {
        if (request.getOptimisticTime() == null || request.getMostLikelyTime() == null || request.getPessimisticTime() == null) {
            throw new IllegalArgumentException("Optimistic, Most Likely, and Pessimistic Times are required.");
        }
        if (request.getOptimisticTime() < 0 || request.getMostLikelyTime() < 0 || request.getPessimisticTime() < 0) {
            throw new IllegalArgumentException("Time estimates cannot be negative.");
        }
        if (request.getOptimisticTime() > request.getMostLikelyTime()
                || request.getMostLikelyTime() > request.getPessimisticTime()) {

            throw new com.innovatepert.exception.InvalidPertValueException(
                    "Invalid PERT values. Please ensure Optimistic Time <= Most Likely Time <= Pessimistic Time.");
        }
    }

    private Double calculateExpectedTime(Double optimistic, Double mostLikely, Double pessimistic) {
        return (optimistic + (4 * mostLikely) + pessimistic) / 6.0;
    }

    private Double calculateVariance(Double optimistic, Double pessimistic) {
        return Math.pow((pessimistic - optimistic) / 6.0, 2);
    }

    private void validateCostDetails(ActivityRequest request) {
        if (request.getNormalCost() == null || request.getNormalCost() <= 0) {
            throw new IllegalArgumentException("Normal Cost must be greater than zero.");
        }

        Double expectedTime = calculateExpectedTime(
                request.getOptimisticTime(),
                request.getMostLikelyTime(),
                request.getPessimisticTime());

        if (request.getCrashTime() != null) {
            if (request.getCrashTime() >= expectedTime) {
                throw new IllegalArgumentException(
                        String.format("Crash Time must be less than the calculated Expected Time (%.2f days).", expectedTime));
            }
            if (request.getCrashCost() == null) {
                throw new IllegalArgumentException("Crash Cost is mandatory when Crash Time is provided.");
            }
            if (request.getCrashCost() <= request.getNormalCost()) {
                throw new IllegalArgumentException("Crash Cost must be greater than Normal Cost.");
            }
        } else {
            if (request.getCrashCost() != null) {
                throw new IllegalArgumentException("Crash Cost cannot be provided without Crash Time.");
            }
        }
    }

    private void validateProjectTargetDuration(Project project, Double newActivityExpectedTime, Long currentActivityId) {
        if (project == null || project.getStartDate() == null || project.getTargetDate() == null) {
            return;
        }

        long targetDuration = java.time.temporal.ChronoUnit.DAYS.between(project.getStartDate(), project.getTargetDate());
        if (targetDuration <= 0) {
            return;
        }

        List<Activity> activities = activityRepository.findByProject(project);
        double existingSum = activities.stream()
                .filter(a -> currentActivityId == null || !a.getActivityId().equals(currentActivityId))
                .mapToDouble(a -> a.getExpectedTime() != null ? a.getExpectedTime() : 0.0)
                .sum();

        double totalExpectedProjectDuration = existingSum + (newActivityExpectedTime != null ? newActivityExpectedTime : 0.0);

        if (totalExpectedProjectDuration > targetDuration) {
            throw new IllegalArgumentException(
                    String.format("Expected project duration (%.2f days) exceeds the business target duration (%d days). Please adjust the activity estimates.",
                            totalExpectedProjectDuration, targetDuration)
            );
        }
    }


    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getAllActivities() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return List.of();
        }
        String email = auth.getName();
        com.innovatepert.entity.User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return List.of();

        List<Project> scopedProjects = (user.getRole() == com.innovatepert.enums.Role.ADMIN)
                ? projectRepository.findProjectsByAdmin(user)
                : projectRepository.findByAssignedTo(user);

        if (scopedProjects.isEmpty()) return List.of();

        List<Activity> activities = activityRepository.findAll().stream()
                .filter(a -> scopedProjects.contains(a.getProject()))
                .toList();

        return activities.stream()
                .sorted(Comparator.comparing(Activity::getCreatedAt))
                .map(a -> enrichResponseWithPredecessor(activityMapper.toResponse(a), a))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getActivitiesByProject(Integer projectId) {
        Project project = getProject(projectId);
        List<Activity> activities = activityRepository.findByProject(project);
        return activities.stream()
                .sorted(Comparator.comparing(Activity::getCreatedAt))
                .map(a -> enrichResponseWithPredecessor(activityMapper.toResponse(a), a))
                .toList();
    }


    @Override
    public ActivityResponse updateActivity(Long activityId, ActivityRequest request) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() ->
                        new ActivityNotFoundException(
                                "Activity not found with id : " + activityId));

        if (activity.getStatus() == ActivityStatus.COMPLETED) {
            throw new InvalidCostException("Activity is already COMPLETED and cannot be modified.");
        }

        Project project = getProject(request.getProjectId());

        if (!activity.getProject().getProjectId().equals(project.getProjectId())
                || !activity.getActivityName().equalsIgnoreCase(request.getActivityName())) {
            validateDuplicateActivity(project, request.getActivityName());
        }

        validatePertValues(request);
        validateCostDetails(request);

        // Validate Budget Allocation
        Double currentAllocated = activityRepository.sumNormalCostByProjectId(project.getProjectId());
        if (currentAllocated == null) currentAllocated = 0.0;
        Double allocatedWithoutThis = currentAllocated - (activity.getNormalCost() != null ? activity.getNormalCost() : 0.0);
        Double projectBudget = project.getBudget() != null ? project.getBudget().doubleValue() : 0.0;
        Double remainingBudget = projectBudget - allocatedWithoutThis;

        if (request.getNormalCost() > remainingBudget) {
            throw new InvalidCostException(
                    String.format("Updated Activity Normal Cost (₹%.2f) exceeds remaining project budget (₹%.2f). Total Project Budget: ₹%.2f.",
                            request.getNormalCost(), remainingBudget, projectBudget));
        }

        Double expectedTime = calculateExpectedTime(
                request.getOptimisticTime(),
                request.getMostLikelyTime(),
                request.getPessimisticTime());

        // Validate Project Business Target Duration
        validateProjectTargetDuration(project, expectedTime, activity.getActivityId());

        Double variance = calculateVariance(
                request.getOptimisticTime(),
                request.getPessimisticTime());

        activity.setProject(project);
        activity.setActivityName(request.getActivityName());
        activity.setOptimisticTime(request.getOptimisticTime());
        activity.setMostLikelyTime(request.getMostLikelyTime());
        activity.setPessimisticTime(request.getPessimisticTime());
        activity.setExpectedTime(expectedTime);
        activity.setVariance(variance);
        activity.setNormalTime(expectedTime);
        activity.setNormalCost(request.getNormalCost());
        activity.setCrashTime(request.getCrashTime());
        activity.setCrashCost(request.getCrashCost());

        Activity updatedActivity = activityRepository.saveAndFlush(activity);

        // Update predecessor dependency link
        List<Dependency> existingPreds = dependencyRepository.findBySuccessorActivity(updatedActivity);
        dependencyRepository.deleteAll(existingPreds);

        if (request.getPredecessorActivityId() != null) {
            Activity pred = activityRepository.findById(request.getPredecessorActivityId()).orElse(null);
            if (pred != null) {
                Dependency dep = Dependency.builder()
                        .project(project)
                        .predecessorActivity(pred)
                        .successorActivity(updatedActivity)
                        .dependencyType("FS")
                        .build();
                dependencyRepository.saveAndFlush(dep);
            }
        }

        // Sync Project Completion Probability & Auto Completion Status
        syncProjectProgressAndStatus(project.getProjectId());

        return enrichResponseWithPredecessor(activityMapper.toResponse(updatedActivity), updatedActivity);
    }

    @Override
    public ActivityResponse updateActivityStatus(Long activityId, ActivityStatus newStatus) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() ->
                        new ActivityNotFoundException(
                                "Activity not found with id : " + activityId));

        ActivityStatus currentStatus = activity.getStatus();

        if (currentStatus == ActivityStatus.COMPLETED) {
            throw new InvalidCostException("Activity is already COMPLETED and cannot be modified.");
        }

        if (currentStatus == ActivityStatus.NOT_STARTED && newStatus == ActivityStatus.COMPLETED) {
            throw new InvalidCostException("Cannot change activity directly from NOT_STARTED to COMPLETED.");
        }

        if (currentStatus == ActivityStatus.IN_PROGRESS && newStatus == ActivityStatus.NOT_STARTED) {
            throw new InvalidCostException("Cannot revert activity status from IN_PROGRESS to NOT_STARTED.");
        }

        if (newStatus == ActivityStatus.IN_PROGRESS) {

            List<Dependency> preds = dependencyRepository.findBySuccessorActivity(activity);
            for (Dependency dep : preds) {
                if (dep.getPredecessorActivity() != null && dep.getPredecessorActivity().getStatus() != ActivityStatus.COMPLETED) {
                    throw new InvalidCostException(
                        String.format("%s cannot be started because %s has not been completed.",
                            activity.getActivityName(), dep.getPredecessorActivity().getActivityName())
                    );
                }
            }
        }

        activity.setStatus(newStatus);
        Activity updatedActivity = activityRepository.saveAndFlush(activity);

        // Sync Project Completion Probability & Auto Completion Status
        syncProjectProgressAndStatus(activity.getProject().getProjectId());

        return enrichResponseWithPredecessor(activityMapper.toResponse(updatedActivity), updatedActivity);
    }

    @Override
    public void deleteActivity(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() ->
                        new ActivityNotFoundException(
                                "Activity not found with id : " + activityId));

        if (dependencyRepository.existsByPredecessorActivity(activity)) {
            throw new IllegalStateException("This activity cannot be deleted because other activities depend on it. Please remove or update those dependencies first.");
        }

        pertResultRepository.findByActivity_ActivityId(activityId)
                .ifPresent(pertResultRepository::delete);

        List<ProjectCrashing> crashings = projectCrashingRepository.findByActivity(activity);
        if (!crashings.isEmpty()) {
            projectCrashingRepository.deleteAll(crashings);
        }

        List<Dependency> succDeps = dependencyRepository.findBySuccessorActivity(activity);

        if (!succDeps.isEmpty()) {
            dependencyRepository.deleteAll(succDeps);
            dependencyRepository.flush();
        }

        Integer projId = activity.getProject().getProjectId();
        activityRepository.delete(activity);
        activityRepository.flush();
        syncProjectProgressAndStatus(projId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectBudgetSummaryResponse getBudgetSummary(Integer projectId) {
        Project project = getProject(projectId);
        Double allocated = activityRepository.sumNormalCostByProjectId(projectId);
        if (allocated == null) allocated = 0.0;
        Double projectBudget = project.getBudget() != null ? project.getBudget().doubleValue() : 0.0;
        Double remaining = projectBudget - allocated;

        return ProjectBudgetSummaryResponse.builder()
                .projectBudget(projectBudget)
                .allocatedBudget(allocated)
                .remainingBudget(remaining)
                .build();
    }

    private ActivityResponse enrichResponseWithPredecessor(ActivityResponse response, Activity activity) {
        if (response == null || activity == null) return response;
        List<Dependency> preds = dependencyRepository.findBySuccessorActivity(activity);
        if (!preds.isEmpty() && preds.get(0).getPredecessorActivity() != null) {
            Activity pred = preds.get(0).getPredecessorActivity();
            response.setPredecessorActivityId(pred.getActivityId());
            response.setPredecessorActivityName(pred.getActivityName());
            response.setPredecessorActivityStatus(pred.getStatus());
        }
        return response;
    }

    private void syncProjectProgressAndStatus(Integer projectId) {
        if (projectId == null) return;
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return;

        activityRepository.flush();
        List<Activity> activities = activityRepository.findByProject(project);
        if (activities.isEmpty()) {
            project.setProjectProgress(0.0);
        } else {
            long completedCount = activities.stream()
                    .filter(a -> a.getStatus() == ActivityStatus.COMPLETED)
                    .count();

            double percentage = ((double) completedCount / activities.size()) * 100.0;
            percentage = Math.round(percentage * 100.0) / 100.0;
            project.setProjectProgress(percentage);

            if (completedCount == activities.size()) {
                project.setStatus(ProjectStatus.COMPLETED);
            } else {
                boolean anyStarted = activities.stream()
                        .anyMatch(a -> a.getStatus() == ActivityStatus.IN_PROGRESS || a.getStatus() == ActivityStatus.COMPLETED);
                
                if (anyStarted) {
                    project.setStatus(ProjectStatus.IN_PROGRESS);
                } else {
                    project.setStatus(ProjectStatus.NOT_STARTED);
                }
            }
        }
        projectRepository.saveAndFlush(project);
    }
}