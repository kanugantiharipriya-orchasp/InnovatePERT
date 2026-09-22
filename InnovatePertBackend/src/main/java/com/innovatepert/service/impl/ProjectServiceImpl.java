package com.innovatepert.service.impl;

import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.request.ProjectRequest;
import com.innovatepert.dto.response.ProjectResponse;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Dependency;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.User;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.enums.Role;
import com.innovatepert.exception.AccessDeniedException;
import com.innovatepert.exception.InvalidCostException;
import com.innovatepert.exception.InvalidProjectDateException;
import com.innovatepert.exception.ProjectAlreadyExistsException;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.exception.UserNotFoundException;
import com.innovatepert.mapper.ProjectMapper;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.DependencyRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.EmailService;
import com.innovatepert.service.ProjectService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectServiceImpl implements ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectServiceImpl.class);

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final DependencyRepository dependencyRepository;
    private final ActivityRepository activityRepository;

    // =========================================================================
    // HELPER: CENTRALIZED VISIBILITY RULES
    // =========================================================================
    
    /**
     * Fetches the complete list of projects a user is authorized to see based on their role.
     * All filter, search, and sort methods use this base list to guarantee data security.
     */
    private List<Project> getAccessibleProjects(User user) {
        List<Project> projects;
        if (user.getRole() == Role.ADMIN) {
            projects = projectRepository.findProjectsByAdmin(user);
        } else {
            // PM sees projects they were assigned
            projects = projectRepository.findByAssignedTo(user);
        }
        return projects.stream()
                .sorted(Comparator.comparing(Project::getCreatedAt))
                .toList();
    }

    private void verifyProjectOwnership(Project project, User user) {
        if (user == null) {
            throw new AccessDeniedException("Access Denied: Unauthenticated user.");
        }
        if (user.getRole() == Role.ADMIN) {
            boolean isUnassigned = project.getAssignedTo() == null && project.getAssignedBy() == null;
            boolean isAssignedBy = project.getAssignedBy() != null && project.getAssignedBy().getUserId().equals(user.getUserId());
            boolean isAssigneeCreatedByAdmin = project.getAssignedTo() != null && project.getAssignedTo().getCreatedByAdmin() != null && project.getAssignedTo().getCreatedByAdmin().getUserId().equals(user.getUserId());

            if (!isUnassigned && !isAssignedBy && !isAssigneeCreatedByAdmin) {
                log.error("SECURITY ALERT: Admin ID {} attempted unauthorized access to Project ID {}", user.getUserId(), project.getProjectId());
                throw new AccessDeniedException("Access Denied: You do not have permission to access projects outside your organization scope.");
            }
        } else if (user.getRole() == Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null && project.getAssignedTo().getUserId().equals(user.getUserId());

            if (!isAssigned) {
                log.error("SECURITY ALERT: Project Manager ID {} attempted unauthorized access to Project ID {}", user.getUserId(), project.getProjectId());
                throw new AccessDeniedException("Access Denied: You do not have permission to view or modify this project.");
            }
        }
    }

    private void validateProjectCanStart(Project project) {
        List<Dependency> dependencies = dependencyRepository.findByProject(project);
        for (Dependency dep : dependencies) {
            if (dep.getPredecessorProject() != null) {
                Project pred = dep.getPredecessorProject();
                if (pred.getStatus() != ProjectStatus.COMPLETED) {
                    throw new InvalidCostException(String.format("Cannot start project '%s' because prerequisite project '%s' is currently %s.", project.getProjectName(), pred.getProjectName(), pred.getStatus()));
                }
            }
            if (dep.getPredecessorActivity() != null) {
                Activity predAct = dep.getPredecessorActivity();
                if (predAct.getStatus() != ActivityStatus.COMPLETED) {
                    throw new InvalidCostException(String.format("Cannot start project '%s' because prerequisite activity '%s' is currently %s.", project.getProjectName(), predAct.getActivityName(), predAct.getStatus()));
                }
            }
        }
    }

    private void validateTargetDateAgainstActivities(Project project, java.time.LocalDate newStartDate, java.time.LocalDate newTargetDate) {
        if (newStartDate == null || newTargetDate == null) return;
        
        long newTargetDuration = java.time.temporal.ChronoUnit.DAYS.between(newStartDate, newTargetDate);
        if (newTargetDuration <= 0) return;

        List<Activity> activities = activityRepository.findByProject(project);
        if (activities.isEmpty()) return;

        double existingSum = activities.stream()
                .mapToDouble(a -> a.getExpectedTime() != null ? a.getExpectedTime() : 0.0)
                .sum();

        if (existingSum > newTargetDuration) {
            throw new InvalidProjectDateException(
                    String.format("Expected project duration (%.2f days) exceeds the new business target duration (%d days). Please adjust the activity estimates first.",
                            existingSum, newTargetDuration)
            );
        }
    }

    private ProjectResponse mapToResponseWithCompletion(Project project) {
        if (project == null) return null;
        ProjectResponse response = projectMapper.toResponse(project);
        
        List<Activity> activities = activityRepository.findByProject(project);
        if (activities.isEmpty()) {
            response.setProjectProgress(0.0);
        } else {
            long completedCount = activities.stream().filter(a -> a.getStatus() == ActivityStatus.COMPLETED).count();
            double percentage = ((double) completedCount / activities.size()) * 100.0;
            response.setProjectProgress(Math.round(percentage * 100.0) / 100.0);
        }
        return response;
    }

    // =========================================================================
    // CORE CRUD OPERATIONS
    // =========================================================================

    @Override
    public ProjectResponse createProject(ProjectRequest request) {
        User loggedInUser = getLoggedInUser();

        if (projectRepository.existsByProjectName(request.getProjectName())) {
            throw new ProjectAlreadyExistsException("Project Name already exists.");
        }

        if (request.getStartDate().isBefore(java.time.LocalDate.now())) {
            throw new InvalidProjectDateException("Start Date cannot be in the past.");
        }

        if (request.getTargetDate().isBefore(request.getStartDate())) {
            throw new InvalidProjectDateException("Target Date cannot be before Start Date.");
        }

        Project project = projectMapper.toEntity(request);
        project.setCompletionProbability(0.0);

        // ONLY ADMIN CREATES PROJECT
        if (loggedInUser.getRole() == Role.PROJECT_MANAGER) {
            throw new AccessDeniedException("Access Denied: Project Managers are not allowed to create projects.");
        }

        if (request.getAssignedToId() != null) {
            User assignedPM = getUser(request.getAssignedToId());
            if (assignedPM.getCreatedByAdmin() == null || !assignedPM.getCreatedByAdmin().getUserId().equals(loggedInUser.getUserId())) {
                throw new AccessDeniedException("Access Denied: You cannot assign projects to Project Managers outside your organization scope.");
            }
            project.setAssignedTo(assignedPM);
            project.setAssignedBy(loggedInUser); 
            project.setStatus(ProjectStatus.NOT_STARTED);
        } else {
            project.setAssignedTo(null);
            project.setAssignedBy(loggedInUser);
            project.setStatus(ProjectStatus.NOT_STARTED);
        }

        Project savedProject = projectRepository.save(project);
        log.info("Successfully created project ID: {} by User ID: {}", savedProject.getProjectId(), loggedInUser.getUserId());

        if (savedProject.getAssignedTo() != null && loggedInUser.getRole() == Role.ADMIN) {
            emailService.sendProjectAssignmentNotification(
                    savedProject.getAssignedTo().getEmail(), savedProject.getAssignedTo().getFullName(),
                    savedProject.getProjectName(), savedProject.getDescription() != null ? savedProject.getDescription() : "N/A",
                    savedProject.getPriority() != null ? savedProject.getPriority().name() : "N/A",
                    savedProject.getStartDate() != null ? savedProject.getStartDate().toString() : "N/A",
                    savedProject.getTargetDate() != null ? savedProject.getTargetDate().toString() : "N/A",
                    savedProject.getBudget() != null ? savedProject.getBudget().toString() : "N/A"
            );
        }

        return mapToResponseWithCompletion(savedProject);
    }

    @Override
    public ProjectResponse updateProject(Integer projectId, ProjectRequest request) {
        User loggedInUser = getLoggedInUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);



        if (!project.getProjectName().equalsIgnoreCase(request.getProjectName()) && projectRepository.existsByProjectName(request.getProjectName())) {
            throw new ProjectAlreadyExistsException("Project Name already exists.");
        }
        if (request.getTargetDate().isBefore(request.getStartDate())) {
            throw new InvalidProjectDateException("Target Date cannot be before Start Date.");
        }

        validateTargetDateAgainstActivities(project, request.getStartDate(), request.getTargetDate());

        StringBuilder changedFields = new StringBuilder();

        if (!project.getProjectName().equals(request.getProjectName())) {
            changedFields.append("* Project Name: `").append(project.getProjectName()).append("` → `").append(request.getProjectName()).append("`\n");
            project.setProjectName(request.getProjectName());
        }

        String oldDesc = project.getDescription() != null ? project.getDescription() : "";
        String newDesc = request.getDescription() != null ? request.getDescription() : "";
        if (!oldDesc.equals(newDesc)) {
            changedFields.append("* Description: `").append(oldDesc).append("` → `").append(newDesc).append("`\n");
            project.setDescription(request.getDescription());
        }

        if (project.getStartDate() == null || !project.getStartDate().equals(request.getStartDate())) {
            changedFields.append("* Start Date: `").append(project.getStartDate() != null ? project.getStartDate().toString() : "N/A").append("` → `").append(request.getStartDate() != null ? request.getStartDate().toString() : "N/A").append("`\n");
            project.setStartDate(request.getStartDate());
        }

        if (project.getTargetDate() == null || !project.getTargetDate().equals(request.getTargetDate())) {
            changedFields.append("* Target Date: `").append(project.getTargetDate() != null ? project.getTargetDate().toString() : "N/A").append("` → `").append(request.getTargetDate() != null ? request.getTargetDate().toString() : "N/A").append("`\n");
            project.setTargetDate(request.getTargetDate());
        }

        if (project.getPriority() != request.getPriority()) {
            changedFields.append("* Priority: `").append(project.getPriority() != null ? project.getPriority().name() : "N/A").append("` → `").append(request.getPriority() != null ? request.getPriority().name() : "N/A").append("`\n");
            project.setPriority(request.getPriority());
        }

        if (project.getBudget() == null || project.getBudget().compareTo(request.getBudget()) != 0) {
            changedFields.append("* Budget: `").append(project.getBudget() != null ? project.getBudget().toString() : "N/A").append("` → `").append(request.getBudget() != null ? request.getBudget().toString() : "N/A").append("`\n");
            project.setBudget(request.getBudget());
        }
        
        if (request.getStatus() != null && request.getStatus() != project.getStatus()) {
            if (loggedInUser.getRole() == Role.ADMIN) {
                throw new AccessDeniedException("Access Denied: Admins are not allowed to update project status.");
            }
            ProjectStatus newStatus = request.getStatus();
            ProjectStatus currentStatus = project.getStatus();
            
            if (currentStatus == ProjectStatus.NOT_STARTED && newStatus != ProjectStatus.IN_PROGRESS) {
                throw new IllegalStateException("Project can only move from Not Started to In Progress.");
            }
            if (currentStatus == ProjectStatus.IN_PROGRESS && newStatus != ProjectStatus.COMPLETED) {
                throw new IllegalStateException("Project can only move from In Progress to Completed.");
            }
            if (currentStatus == ProjectStatus.COMPLETED) {
                throw new IllegalStateException("Project is already Completed and cannot be changed.");
            }
            
            if (newStatus == ProjectStatus.COMPLETED) {
                List<Activity> activities = activityRepository.findByProject(project);
                boolean allCompleted = activities.stream().allMatch(a -> a.getStatus() == ActivityStatus.COMPLETED);
                if (!allCompleted || activities.isEmpty()) {
                    throw new IllegalStateException("The project cannot be marked as Completed because one or more activities are not completed. Please complete all activities before completing the project.");
                }
            }
            
            project.setStatus(newStatus);
        }

        if (request.getAssignedToId() != null && loggedInUser.getRole() == Role.ADMIN) {
            User assignedPM = getUser(request.getAssignedToId());
            project.setAssignedTo(assignedPM);
            project.setAssignedBy(loggedInUser);
        }

        Project updatedProject = projectRepository.save(project);
        
        if (updatedProject.getAssignedTo() != null && loggedInUser.getRole() == Role.ADMIN && changedFields.length() > 0) {
            emailService.sendProjectUpdateNotification(
                updatedProject.getAssignedTo().getEmail(),
                updatedProject.getAssignedTo().getFullName(),
                updatedProject.getProjectName(),
                changedFields.toString().trim()
            );
        }
        
        return mapToResponseWithCompletion(updatedProject);
    }

    @Override
    public ProjectResponse updateProjectStatus(Integer projectId, ProjectStatus status) {
        User loggedInUser = getLoggedInUser();
        if (loggedInUser.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Admins are not allowed to update project status.");
        }
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);

        ProjectStatus currentStatus = project.getStatus();
        if (status != currentStatus) {
            if (currentStatus == ProjectStatus.NOT_STARTED && status != ProjectStatus.IN_PROGRESS) {
                throw new IllegalStateException("Project can only move from Not Started to In Progress.");
            }
            if (currentStatus == ProjectStatus.IN_PROGRESS && status != ProjectStatus.COMPLETED) {
                throw new IllegalStateException("Project can only move from In Progress to Completed.");
            }
            if (currentStatus == ProjectStatus.COMPLETED) {
                throw new IllegalStateException("Project is already Completed and cannot be changed.");
            }
            
            if (status == ProjectStatus.COMPLETED) {
                List<Activity> activities = activityRepository.findByProject(project);
                boolean allCompleted = activities.stream().allMatch(a -> a.getStatus() == ActivityStatus.COMPLETED);
                if (!allCompleted || activities.isEmpty()) {
                    throw new IllegalStateException("The project cannot be marked as Completed because one or more activities are not completed. Please complete all activities before completing the project.");
                }
            }
            
            project.setStatus(status);
        }

        Project updatedProject = projectRepository.save(project);
        return mapToResponseWithCompletion(updatedProject);
    }

    @Override
    public void deleteProject(Integer projectId) {
        User loggedInUser = getLoggedInUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);
        project.setIsDeleted(true);
        projectRepository.save(project);
        log.info("Successfully soft-deleted project ID: {} by User ID: {}", projectId, loggedInUser.getUserId());
    }

    @Override
    public List<ProjectResponse> getDeletedProjects() {
        User loggedInUser = getLoggedInUser();
        if (loggedInUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Only admins can view deleted projects.");
        }
        List<Project> projects = projectRepository.findDeletedProjectsByAdmin(loggedInUser.getUserId());
        return projects.stream().map(this::mapToResponseWithCompletion).toList();
    }

    @Override
    @Transactional
    public ProjectResponse restoreProject(Integer projectId) {
        User loggedInUser = getLoggedInUser();
        if (loggedInUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Only admins can restore projects.");
        }
        
        Project project = projectRepository.findDeletedById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Deleted project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);
        
        projectRepository.restoreProjectNative(projectId);
        
        // Fetch the restored project to return its updated state
        Project restoredProject = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Restored project not found with ID : " + projectId));
        log.info("Successfully restored project ID: {} by User ID: {}", projectId, loggedInUser.getUserId());
        return mapToResponseWithCompletion(restoredProject);
    }

    @Override
    @Transactional
    public void permanentlyDeleteProject(Integer projectId) {
        User loggedInUser = getLoggedInUser();
        if (loggedInUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Only admins can permanently delete projects.");
        }
        
        Project project = projectRepository.findDeletedById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Deleted project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);

        // Manually cascade hard deletes to avoid foreign key constraints
        projectRepository.hardDeleteDependenciesNative(projectId);
        projectRepository.hardDeletePertResultsNative(projectId);
        projectRepository.hardDeleteCrashingNative(projectId);
        projectRepository.hardDeleteActivitiesNative(projectId);
        projectRepository.hardDeleteRiskAnalysisNative(projectId);
        projectRepository.hardDeleteReportsNative(projectId);

        // Finally, hard delete the project
        projectRepository.hardDeleteNative(projectId);
        log.info("Successfully permanently deleted project ID: {} by User ID: {}", projectId, loggedInUser.getUserId());
    }


    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return getAccessibleProjects(getLoggedInUser()).stream()
                .map(this::mapToResponseWithCompletion)
                .toList();
    }



    @Override
    public ProjectResponse assignProjectManager(Integer projectId, Integer pmUserId) {
        User loggedInUser = getLoggedInUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));

        verifyProjectOwnership(project, loggedInUser);
        User assignedPM = getUser(pmUserId);

        if (assignedPM.getRole() != Role.PROJECT_MANAGER) {
            throw new IllegalArgumentException("Assigned user must have the PROJECT_MANAGER role.");
        }

        project.setAssignedTo(assignedPM);
        project.setAssignedBy(loggedInUser);

        if (project.getStatus() == null) {
            project.setStatus(ProjectStatus.NOT_STARTED);
        }

        Project updatedProject = projectRepository.save(project);
        return mapToResponseWithCompletion(updatedProject);
    }

    @Override
    @Transactional
    public ProjectResponse transferProject(Integer projectId, Integer newPmUserId) {
        User loggedInUser = getLoggedInUser();
        if (loggedInUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Only Admin can transfer projects.");
        }
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));
        verifyProjectOwnership(project, loggedInUser);

        User oldPM = project.getAssignedTo();
        if (oldPM == null) {
            throw new IllegalArgumentException("Cannot transfer an unassigned project.");
        }

        User newPM = getUser(newPmUserId);
        if (newPM.getRole() != Role.PROJECT_MANAGER) {
            throw new IllegalArgumentException("Assigned user must have the PROJECT_MANAGER role.");
        }

        if (oldPM.getUserId().equals(newPM.getUserId())) {
            throw new IllegalArgumentException("The new Project Manager is already assigned to this project.");
        }

        project.setAssignedTo(newPM);
        Project updatedProject = projectRepository.save(project);

        try {
            emailService.sendProjectTransferNotificationToOldPM(oldPM.getEmail(), oldPM.getFullName(), project.getProjectName(), newPM.getFullName());
            emailService.sendProjectTransferNotificationToNewPM(newPM.getEmail(), newPM.getFullName(), project.getProjectName(), oldPM.getFullName());
        } catch (Exception e) {
            log.error("Failed to send project transfer emails for project ID {}: {}", projectId, e.getMessage());
        }

        return mapToResponseWithCompletion(updatedProject);
    }

    // =========================================================================
    // PRIVATE UTILITY METHODS
    // =========================================================================
    private User getLoggedInUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated.");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Authenticated user not found with email: " + email));
    }

    private User getUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID : " + userId));
    }
}