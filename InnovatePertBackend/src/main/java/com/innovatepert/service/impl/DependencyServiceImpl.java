package com.innovatepert.service.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.request.DependencyRequest;
import com.innovatepert.dto.response.DependencyResponse;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Dependency;
import com.innovatepert.entity.Project;
import com.innovatepert.exception.ActivityNotFoundException;
import com.innovatepert.exception.CircularDependencyException;
import com.innovatepert.exception.DependencyAlreadyExistsException;
import com.innovatepert.exception.DependencyNotFoundException;
import com.innovatepert.exception.InvalidDependencyException;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.mapper.DependencyMapper;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.DependencyRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.DependencyService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DependencyServiceImpl implements DependencyService {

    private final DependencyRepository dependencyRepository;
    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final DependencyMapper dependencyMapper;
    private final UserRepository userRepository;

    private Activity getActivity(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found with id : " + activityId));
        getProject(activity.getProject().getProjectId());
        return activity;
    }

    private Project getProject(Integer projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id : " + projectId));
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
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access dependencies of projects outside your organization scope.");
            }
        } else if (user.getRole() == com.innovatepert.enums.Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null && project.getAssignedTo().getUserId().equals(user.getUserId());
            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access dependencies of unassigned projects.");
            }
        }
    }

    @Override
    public DependencyResponse createDependency(DependencyRequest request) {

        // Check if Project-to-Project dependency
        if (request.getPredecessorProjectId() != null) {
            Project dependentProject = null;
            if (request.getProjectId() != null) {
                dependentProject = getProject(request.getProjectId());
            } else if (request.getSuccessorActivityId() != null) {
                Activity succ = getActivity(request.getSuccessorActivityId());
                dependentProject = succ.getProject();
            } else {
                throw new InvalidDependencyException("Target project or successor activity is required.");
            }

            Project predProject = getProject(request.getPredecessorProjectId());

            if (dependentProject.getProjectId().equals(predProject.getProjectId())) {
                throw new InvalidDependencyException("A project cannot depend on itself.");
            }

            if (dependencyRepository.existsByProjectAndPredecessorProject(dependentProject, predProject)) {
                throw new DependencyAlreadyExistsException("Project dependency already exists.");
            }

            // Check circular project dependency
            if (dependencyRepository.existsByProjectAndPredecessorProject(predProject, dependentProject)) {
                throw new CircularDependencyException("Circular project dependency is not allowed.");
            }

            Activity successorActivity = null;
            if (request.getSuccessorActivityId() != null) {
                successorActivity = getActivity(request.getSuccessorActivityId());
            }

            Dependency dependency = Dependency.builder()
                    .project(dependentProject)
                    .predecessorProject(predProject)
                    .successorActivity(successorActivity)
                    .dependencyType(request.getDependencyType() != null ? request.getDependencyType() : "FS")
                    .build();

            Dependency saved = dependencyRepository.save(dependency);
            return dependencyMapper.toResponse(saved);
        }

        // Activity-to-Activity dependency
        if (request.getPredecessorActivityId() == null || request.getSuccessorActivityId() == null) {
            throw new InvalidDependencyException("Predecessor and successor activities are required for activity dependencies.");
        }

        Activity predecessor = getActivity(request.getPredecessorActivityId());
        Activity successor = getActivity(request.getSuccessorActivityId());

        if (predecessor.getActivityId().equals(successor.getActivityId())) {
            throw new InvalidDependencyException("An activity cannot depend on itself.");
        }

        Project targetProject = predecessor.getProject();

        if (dependencyRepository.existsByProjectAndPredecessorActivityAndSuccessorActivity(targetProject, predecessor, successor)) {
            throw new DependencyAlreadyExistsException("Dependency already exists.");
        }

        if (dependencyRepository.existsByProjectAndPredecessorActivityAndSuccessorActivity(targetProject, successor, predecessor)) {
            throw new CircularDependencyException("Circular dependency is not allowed.");
        }

        Dependency dependency = Dependency.builder()
                .project(targetProject)
                .predecessorActivity(predecessor)
                .successorActivity(successor)
                .dependencyType(request.getDependencyType() != null ? request.getDependencyType() : "FS")
                .build();

        Dependency savedDependency = dependencyRepository.save(dependency);
        return dependencyMapper.toResponse(savedDependency);
    }


    @Override
    @Transactional(readOnly = true)
    public List<DependencyResponse> getDependenciesByProject(Integer projectId) {
        Project project = getProject(projectId);
        return dependencyRepository.findByProject(project)
                .stream()
                .map(dependencyMapper::toResponse)
                .toList();
    }


    @Override
    public void deleteDependency(Long dependencyId) {
        Dependency dependency = dependencyRepository.findById(dependencyId)
                .orElseThrow(() -> new DependencyNotFoundException("Dependency not found with id : " + dependencyId));
        verifyProjectAccess(dependency.getProject());
        dependencyRepository.delete(dependency);
    }
}