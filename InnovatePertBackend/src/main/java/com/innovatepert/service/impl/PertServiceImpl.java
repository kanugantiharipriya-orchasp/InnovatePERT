package com.innovatepert.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.request.UpdateActualTimeRequestDTO;
import com.innovatepert.dto.response.PertResultResponseDTO;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.PertResult;
import com.innovatepert.entity.Project;
import com.innovatepert.exception.InvalidPertDataException;
import com.innovatepert.exception.PertResultNotFoundException;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.PertResultRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.PertService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PertServiceImpl implements PertService {

    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;
    private final PertResultRepository pertResultRepository;
    private final UserRepository userRepository;

    @Override
    public List<PertResultResponseDTO> generateProjectPertAnalysis(Integer projectId) {
        // 1. Verify project exists
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID: " + projectId));
        verifyProjectAccess(project);

        // 2. Fetch activities for the project
        List<Activity> activities = activityRepository.findByProject_ProjectId(projectId);
        if (activities.isEmpty()) {
            throw new InvalidPertDataException("Cannot generate PERT analysis: No activities found for Project ID " + projectId);
        }

        List<PertResult> pertResultsToSave = new ArrayList<>();

        for (Activity activity : activities) {
            // 3. Validate times and expected_time
            validateActivityTimeEstimates(activity);

            // 4. Calculate Variance and Standard Deviation
            double optimistic = activity.getOptimisticTime();
            double pessimistic = activity.getPessimisticTime();

            double standardDeviation = (pessimistic - optimistic) / 6.0;
            double variance = Math.pow(standardDeviation, 2);

            // Round calculations to 2 decimal places for clean persistence
            standardDeviation = Math.round(standardDeviation * 100.0) / 100.0;
            variance = Math.round(variance * 100.0) / 100.0;

            // 5. Upsert: Update if record exists, create new if it doesn't
            Optional<PertResult> existingPertResultOpt = pertResultRepository
                    .findByActivity_ActivityId(activity.getActivityId());

            PertResult pertResult;
            if (existingPertResultOpt.isPresent()) {
                pertResult = existingPertResultOpt.get();
                pertResult.setOptimisticTime(optimistic);
                pertResult.setMostLikelyTime(activity.getMostLikelyTime());
                pertResult.setPessimisticTime(pessimistic);
                pertResult.setExpectedTime(activity.getExpectedTime());
                pertResult.setVariance(variance);
                pertResult.setStandardDeviation(standardDeviation);
            } else {
                pertResult = PertResult.builder()
                        .project(project)
                        .activity(activity)
                        .optimisticTime(optimistic)
                        .mostLikelyTime(activity.getMostLikelyTime())
                        .pessimisticTime(pessimistic)
                        .expectedTime(activity.getExpectedTime())
                        .variance(variance)
                        .standardDeviation(standardDeviation)
                        .actualTime(null) // Initially NULL
                        .build();
            }

            pertResultsToSave.add(pertResult);
        }

        List<PertResult> savedResults = pertResultRepository.saveAll(pertResultsToSave);

        return savedResults.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PertResultResponseDTO> getPertResultsByProject(Integer projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ProjectNotFoundException("Project not found with ID: " + projectId);
        }

        List<PertResult> results = pertResultRepository.findByProject_ProjectId(projectId);
        return results.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    

    // --- Helper Validation Methods ---

    private void validateActivityTimeEstimates(Activity activity) {
        Double o = activity.getOptimisticTime();
        Double m = activity.getMostLikelyTime();
        Double p = activity.getPessimisticTime();
        Double te = activity.getExpectedTime();

        if (o == null || m == null || p == null) {
            throw new InvalidPertDataException(
                    "Activity '" + activity.getActivityName() + "' (ID: " + activity.getActivityId() +
                    ") has missing time estimate values.");
        }

        if (o < 0 || m < 0 || p < 0) {
            throw new InvalidPertDataException(
                    "Time estimates for Activity '" + activity.getActivityName() + "' cannot be negative.");
        }

        // Rule: Pessimistic Time >= Most Likely Time >= Optimistic Time
        if (p < m || m < o) {
            throw new InvalidPertDataException(
                    "Invalid time hierarchy for Activity '" + activity.getActivityName() +
                    "': Expected Pessimistic (" + p + ") >= Most Likely (" + m + ") >= Optimistic (" + o + ")");
        }

        if (te == null) {
            throw new InvalidPertDataException(
                    "Expected Time (TE) is missing for Activity '" + activity.getActivityName() +
                    "'. Ensure activity creation calculated expected time properly.");
        }
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
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access PERT results for projects outside your organization scope.");
            }
        } else if (user.getRole() == com.innovatepert.enums.Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null && project.getAssignedTo().getUserId().equals(user.getUserId());
            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access PERT results for unassigned projects.");
            }
        }
    }

    // --- Helper Mapping Method ---

    private PertResultResponseDTO mapToResponseDTO(PertResult entity) {
        return PertResultResponseDTO.builder()
                .pertId(entity.getPertId())
                .projectId(entity.getProject().getProjectId())
                .projectName(entity.getProject().getProjectName())
                .activityId(entity.getActivity().getActivityId())
                .activityName(entity.getActivity().getActivityName())
//                .description(entity.getActivity().getDescription())
                .activityStatus(entity.getActivity().getStatus())
                .optimisticTime(entity.getOptimisticTime())
                .mostLikelyTime(entity.getMostLikelyTime())
                .pessimisticTime(entity.getPessimisticTime())
                .expectedTime(entity.getExpectedTime())
                .variance(entity.getVariance())
                .standardDeviation(entity.getStandardDeviation())
                .actualTime(entity.getActualTime())
                .calculatedAt(entity.getCalculatedAt())
                .build();
    }
}