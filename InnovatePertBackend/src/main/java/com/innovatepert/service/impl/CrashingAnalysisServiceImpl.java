package com.innovatepert.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.request.CrashingAnalysisRequestDTO;
import com.innovatepert.dto.response.CrashActivityResponseDTO;
import com.innovatepert.dto.response.CrashingAnalysisResponseDTO;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.ProjectCrashing;
import com.innovatepert.entity.User;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.ProjectCrashingRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.CrashingAnalysisService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CrashingAnalysisServiceImpl implements CrashingAnalysisService {

    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;
    private final ProjectCrashingRepository projectCrashingRepository;
    private final UserRepository userRepository;

    private static final String[] PRIORITY_LABELS = {
        "⭐ Crash First", "⭐ Crash Second", "⭐ Crash Third", "⭐ Crash Fourth",
        "⭐ Crash Fifth", "⭐ Crash Sixth", "⭐ Crash Seventh", "⭐ Crash Eighth"
    };

    private User getLoggedInUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String email = auth.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private Project getProject(Integer projectId) {
        if (projectId == null) {
            throw new ProjectNotFoundException("Project ID cannot be null.");
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID : " + projectId));
    }

    @Override
    @Transactional(readOnly = true)
    public CrashingAnalysisResponseDTO getProjectCrashingOverview(Integer projectId) {
        Project project = getProject(projectId);
        List<Activity> activities = activityRepository.findByProject(project);

        double currentDuration = activities.stream()
                .mapToDouble(a -> a.getExpectedTime() != null ? a.getExpectedTime() : (a.getMostLikelyTime() != null ? a.getMostLikelyTime() : 0.0))
                .sum();
        currentDuration = Math.round(currentDuration * 100.0) / 100.0;

        List<CrashActivityResponseDTO> crashableList = new ArrayList<>();
        double maxPossibleReduction = 0.0;

        for (Activity a : activities) {
            double normalT = a.getExpectedTime() != null ? a.getExpectedTime() : (a.getMostLikelyTime() != null ? a.getMostLikelyTime() : 0.0);
            double crashT = a.getCrashTime() != null ? a.getCrashTime() : normalT;
            double timeSaved = Math.max(0.0, normalT - crashT);

            if (timeSaved > 0) {
                double normalC = a.getNormalCost() != null ? a.getNormalCost() : 0.0;
                double crashC = a.getCrashCost() != null ? a.getCrashCost() : normalC;
                double extraCost = Math.max(0.0, crashC - normalC);
                double costSlope = extraCost / timeSaved;

                maxPossibleReduction += timeSaved;

                crashableList.add(CrashActivityResponseDTO.builder()
                        .activityId(a.getActivityId())
                        .activityName(a.getActivityName())
                        .normalTime(Math.round(normalT * 100.0) / 100.0)
                        .crashTime(Math.round(crashT * 100.0) / 100.0)
                        .timeSaved(Math.round(timeSaved * 100.0) / 100.0)
                        .normalCost(normalC)
                        .crashCost(crashC)
                        .additionalCost(extraCost)
                        .costSlope(Math.round(costSlope * 100.0) / 100.0)
                        .recommended(false)
                        .build());
            }
        }

        maxPossibleReduction = Math.round(maxPossibleReduction * 100.0) / 100.0;
        double minAchievable = Math.max(0.0, Math.round((currentDuration - maxPossibleReduction) * 100.0) / 100.0);

        crashableList.sort(Comparator.comparingDouble(CrashActivityResponseDTO::getCostSlope));

        return CrashingAnalysisResponseDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .currentDuration(currentDuration)
                .maxPossibleReduction(maxPossibleReduction)
                .minAchievableDuration(minAchievable)
                .newTargetDuration(currentDuration)
                .requiredReduction(0.0)
                .totalTimeSaved(0.0)
                .totalAdditionalCost(0.0)
                .activities(crashableList)
                .build();
    }

    @Override
    public CrashingAnalysisResponseDTO runCrashingAnalysis(CrashingAnalysisRequestDTO request) {
        if (request == null || request.getProjectId() == null) {
            throw new IllegalArgumentException("Project ID is required.");
        }

        Project project = getProject(request.getProjectId());
        List<Activity> activities = activityRepository.findByProject(project);

        if (activities.isEmpty()) {
            throw new IllegalArgumentException("This project contains no activities. Cannot run crash analysis.");
        }

        double currentDuration = activities.stream()
                .mapToDouble(a -> a.getExpectedTime() != null ? a.getExpectedTime() : (a.getMostLikelyTime() != null ? a.getMostLikelyTime() : 0.0))
                .sum();
        currentDuration = Math.round(currentDuration * 100.0) / 100.0;

        List<CrashActivityResponseDTO> crashableCandidates = new ArrayList<>();
        double maxPossibleReduction = 0.0;

        for (Activity a : activities) {
            double normalT = a.getExpectedTime() != null ? a.getExpectedTime() : (a.getMostLikelyTime() != null ? a.getMostLikelyTime() : 0.0);
            double crashT = a.getCrashTime() != null ? a.getCrashTime() : normalT;
            double timeSaved = Math.max(0.0, normalT - crashT);

            if (timeSaved > 0) {
                double normalC = a.getNormalCost() != null ? a.getNormalCost() : 0.0;
                double crashC = a.getCrashCost() != null ? a.getCrashCost() : normalC;
                double extraCost = Math.max(0.0, crashC - normalC);
                double costSlope = extraCost / timeSaved;

                maxPossibleReduction += timeSaved;

                crashableCandidates.add(CrashActivityResponseDTO.builder()
                        .activityId(a.getActivityId())
                        .activityName(a.getActivityName())
                        .normalTime(Math.round(normalT * 100.0) / 100.0)
                        .crashTime(Math.round(crashT * 100.0) / 100.0)
                        .timeSaved(Math.round(timeSaved * 100.0) / 100.0)
                        .normalCost(normalC)
                        .crashCost(crashC)
                        .additionalCost(extraCost)
                        .costSlope(Math.round(costSlope * 100.0) / 100.0)
                        .recommended(false)
                        .build());
            }
        }

        maxPossibleReduction = Math.round(maxPossibleReduction * 100.0) / 100.0;
        double minAchievableDuration = Math.max(0.0, Math.round((currentDuration - maxPossibleReduction) * 100.0) / 100.0);

        if (crashableCandidates.isEmpty()) {
            throw new IllegalArgumentException("This project contains no crashable activities. Project duration cannot be reduced.");
        }

        Double newTarget = request.getNewTargetDuration();
        if (newTarget == null) {
            throw new IllegalArgumentException("Target duration is required.");
        }

        if (newTarget >= currentDuration) {
            throw new IllegalArgumentException("Target duration must be less than current duration (" + currentDuration + " days).");
        }

        if (newTarget < minAchievableDuration) {
            throw new IllegalArgumentException("Project cannot be crashed beyond the minimum achievable duration (" + minAchievableDuration + " days).");
        }

        double requiredReduction = Math.round((currentDuration - newTarget) * 100.0) / 100.0;

        // Sort candidates by Cost Per Day Saved Ascending (minimum cost slope first)
        crashableCandidates.sort(Comparator.comparingDouble(CrashActivityResponseDTO::getCostSlope));

        double accumulatedReduction = 0.0;
        double accumulatedAdditionalCost = 0.0;
        int priorityCounter = 1;

        List<CrashActivityResponseDTO> finalActivitiesList = new ArrayList<>();

        for (CrashActivityResponseDTO item : crashableCandidates) {
            if (accumulatedReduction < requiredReduction) {
                double remainingNeeded = requiredReduction - accumulatedReduction;
                double actualSaved = Math.min(item.getTimeSaved(), remainingNeeded);
                double proportionCost = actualSaved * item.getCostSlope();

                item.setPriority(priorityCounter);
                item.setRecommended(true);
                item.setTimeSaved(Math.round(actualSaved * 100.0) / 100.0);
                item.setAdditionalCost(Math.round(proportionCost * 100.0) / 100.0);

                String label = (priorityCounter - 1 < PRIORITY_LABELS.length)
                        ? PRIORITY_LABELS[priorityCounter - 1]
                        : "⭐ Crash Priority " + priorityCounter;
                item.setRecommendation(label);

                accumulatedReduction += actualSaved;
                accumulatedAdditionalCost += proportionCost;
                priorityCounter++;
            } else {
                item.setRecommended(false);
                item.setPriority(null);
                item.setRecommendation("Optional");
            }
            finalActivitiesList.add(item);
        }

        return CrashingAnalysisResponseDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .currentDuration(currentDuration)
                .maxPossibleReduction(maxPossibleReduction)
                .minAchievableDuration(minAchievableDuration)
                .newTargetDuration(newTarget)
                .requiredReduction(requiredReduction)
                .totalTimeSaved(Math.round(accumulatedReduction * 100.0) / 100.0)
                .totalAdditionalCost(Math.round(accumulatedAdditionalCost * 100.0) / 100.0)
                .activities(finalActivitiesList)
                .build();
    }

    @Override
    public CrashingAnalysisResponseDTO submitCrashingAnalysis(CrashingAnalysisResponseDTO response) {
        if (response == null || response.getProjectId() == null) {
            throw new IllegalArgumentException("Invalid crash analysis response data for submission.");
        }

        Project project = getProject(response.getProjectId());
        User loggedInUser = getLoggedInUser();

        Long crashingId = System.currentTimeMillis();

        if (response.getActivities() != null) {
            for (CrashActivityResponseDTO actDto : response.getActivities()) {
                Activity actEntity = null;
                if (actDto.getActivityId() != null) {
                    actEntity = activityRepository.findById(actDto.getActivityId()).orElse(null);
                }

                ProjectCrashing crashingRow = ProjectCrashing.builder()
                        .crashingId(crashingId)
                        .project(project)
                        .activity(actEntity)
                        .activityName(actDto.getActivityName())
                        .normalTime(actDto.getNormalTime())
                        .crashTime(actDto.getCrashTime())
                        .timeSaved(actDto.getTimeSaved())
                        .normalCost(actDto.getNormalCost())
                        .crashCost(actDto.getCrashCost())
                        .additionalCost(actDto.getAdditionalCost())
                        .costSlope(actDto.getCostSlope())
                        .priority(actDto.getPriority())
                        .recommendation(actDto.getRecommendation())
                        .recommended(actDto.getRecommended())
                        .currentDuration(response.getCurrentDuration())
                        .targetDuration(response.getNewTargetDuration())
                        .totalTimeSaved(response.getTotalTimeSaved())
                        .totalAdditionalCost(response.getTotalAdditionalCost())
                        .createdBy(loggedInUser)
                        .build();

                projectCrashingRepository.save(crashingRow);
            }
        }

        response.setProjectId(project.getProjectId());
        return response;
    }
}
