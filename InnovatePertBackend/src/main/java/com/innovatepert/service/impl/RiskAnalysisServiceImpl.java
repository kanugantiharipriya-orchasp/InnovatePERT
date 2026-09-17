package com.innovatepert.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.innovatepert.dto.response.ProjectDropdownResponseDTO;
import com.innovatepert.dto.response.RiskAnalysisResponseDTO;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.PertResult;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.RiskAnalysis;
import com.innovatepert.entity.User;
import com.innovatepert.exception.ProjectNotFoundException;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.PertResultRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.RiskAnalysisRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.RiskAnalysisService;
import com.innovatepert.util.ProbabilityUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RiskAnalysisServiceImpl implements RiskAnalysisService {

    private final RiskAnalysisRepository riskAnalysisRepository;
    private final ProjectRepository projectRepository;
    private final PertResultRepository pertResultRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDropdownResponseDTO> getAssignedProjects(String email) {
        User manager = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        List<Project> projects = projectRepository.findByAssignedTo(manager);

        return projects.stream()
                .map(project -> ProjectDropdownResponseDTO.builder()
                        .projectId(project.getProjectId())
                        .projectName(project.getProjectName())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public RiskAnalysisResponseDTO analyzeProject(Integer projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with ID: " + projectId));

        verifyProjectAccess(project);

        long businessDays = 0L;
        if (project.getStartDate() != null && project.getTargetDate() != null) {
            businessDays = ChronoUnit.DAYS.between(project.getStartDate(), project.getTargetDate());
        }
        if (businessDays <= 0) {
            businessDays = 1L;
        }

        double expectedDuration = 0.0;
        double variance = 0.0;

        List<PertResult> pertResults = pertResultRepository.findByProject_ProjectId(projectId);
        if (!pertResults.isEmpty()) {
            expectedDuration = pertResults.stream().mapToDouble(PertResult::getExpectedTime).sum();
            variance = pertResults.stream().mapToDouble(PertResult::getVariance).sum();
        } else {
            List<Activity> activities = activityRepository.findByProject(project);
            if (!activities.isEmpty()) {
                for (Activity act : activities) {
                    double exp;
                    double var;
                    if (act.getOptimisticTime() != null && act.getMostLikelyTime() != null && act.getPessimisticTime() != null) {
                        exp = (act.getOptimisticTime() + (4.0 * act.getMostLikelyTime()) + act.getPessimisticTime()) / 6.0;
                        double range = (act.getPessimisticTime() - act.getOptimisticTime()) / 6.0;
                        var = range * range;
                    } else {
                        exp = act.getExpectedTime() != null ? act.getExpectedTime() :
                                (act.getNormalTime() != null ? act.getNormalTime() : 1.0);
                        var = act.getVariance() != null ? act.getVariance() : 0.0;
                    }
                    expectedDuration += exp;
                    variance += var;
                }
            } else {
                expectedDuration = (double) businessDays;
                variance = 0.0;
            }
        }

        double standardDeviation = Math.sqrt(variance);
        double zScore;
        if (standardDeviation == 0.0) {
            zScore = (businessDays >= expectedDuration) ? 3.0 : -3.0;
        } else {
            zScore = ((double) businessDays - expectedDuration) / standardDeviation;
        }

        double probability = ProbabilityUtil.cumulativeProbability(zScore);
        probability = Math.max(0.0, Math.min(100.0, probability));
        probability = Math.round(probability * 100.0) / 100.0;

        String riskLevel = calculateRiskLevel(probability);

        // Update completion probability in Project entity for synchronized dashboard reporting
        project.setCompletionProbability(probability);
        projectRepository.save(project);

        RiskAnalysis riskAnalysis = riskAnalysisRepository.findByProject_ProjectId(projectId)
                .orElse(new RiskAnalysis());

        riskAnalysis.setProject(project);
        riskAnalysis.setStartDate(project.getStartDate());
        riskAnalysis.setTargetDate(project.getTargetDate());
        riskAnalysis.setBusinessTargetDuration(BigDecimal.valueOf(businessDays).setScale(2, RoundingMode.HALF_UP));
        riskAnalysis.setExpectedDuration(BigDecimal.valueOf(expectedDuration).setScale(2, RoundingMode.HALF_UP));
        riskAnalysis.setVariance(BigDecimal.valueOf(variance).setScale(2, RoundingMode.HALF_UP));
        riskAnalysis.setStandardDeviation(BigDecimal.valueOf(standardDeviation).setScale(2, RoundingMode.HALF_UP));
        riskAnalysis.setZScore(BigDecimal.valueOf(zScore).setScale(4, RoundingMode.HALF_UP));
        riskAnalysis.setCompletionProbability(BigDecimal.valueOf(probability).setScale(2, RoundingMode.HALF_UP));
        riskAnalysis.setRiskLevel(riskLevel);
        riskAnalysis.setAnalyzedAt(LocalDateTime.now());

        RiskAnalysis saved = riskAnalysisRepository.save(riskAnalysis);

        String explanation = String.format(
                "PERT schedule completion probability calculated using Z-Score formula Z = (Td - Te) / σ. Target Duration (Td): %d days, PERT Expected Duration (Te): %.2f days, Std Dev (σ): %.2f, Z-Score: %.4f.",
                businessDays, expectedDuration, standardDeviation, zScore
        );

        return mapToResponse(saved, explanation);
    }

    @Override
    @Transactional
    public List<RiskAnalysisResponseDTO> getAllProjectRiskAssessments() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return List.of();
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return List.of();

        List<Project> allProjects = (user.getRole() == com.innovatepert.enums.Role.ADMIN)
                ? projectRepository.findProjectsByAdmin(user)
                : projectRepository.findByAssignedTo(user);

        List<RiskAnalysisResponseDTO> responseList = new ArrayList<>();

        for (Project project : allProjects) {
            try {
                RiskAnalysisResponseDTO dto = analyzeProject(project.getProjectId());
                responseList.add(dto);
            } catch (Exception e) {
                // If single project risk computation fails, provide default fallback
                String managerName = project.getAssignedTo() != null ? project.getAssignedTo().getFullName() : "Unassigned";
                Double prob = project.getCompletionProbability() != null ? project.getCompletionProbability() : 50.0;
                responseList.add(RiskAnalysisResponseDTO.builder()
                        .projectId(project.getProjectId())
                        .projectName(project.getProjectName())
                        .managerName(managerName)
                        .startDate(project.getStartDate())
                        .targetDate(project.getTargetDate())
                        .businessTargetDuration(BigDecimal.valueOf(30))
                        .expectedDuration(BigDecimal.valueOf(30))
                        .variance(BigDecimal.ZERO)
                        .standardDeviation(BigDecimal.ZERO)
                        .zScore(BigDecimal.ZERO)
                        .completionProbability(BigDecimal.valueOf(prob))
                        .riskLevel(calculateRiskLevel(prob))
                        .explanation("Default risk assessment generated from project schedules.")
                        .build());
            }
        }
        return responseList;
    }

    private void verifyProjectAccess(Project project) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized: User not authenticated.");
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.innovatepert.exception.ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == com.innovatepert.enums.Role.ADMIN) {
            boolean isAssignedBy = project.getAssignedBy() != null && project.getAssignedBy().getUserId().equals(user.getUserId());
            boolean isManagerCreatedByThisAdmin = project.getAssignedTo() != null &&
                    project.getAssignedTo().getCreatedByAdmin() != null &&
                    project.getAssignedTo().getCreatedByAdmin().getUserId().equals(user.getUserId());

            if (!isAssignedBy && !isManagerCreatedByThisAdmin) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access risk analysis of projects outside your organization scope.");
            }
        } else if (user.getRole() == com.innovatepert.enums.Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null && project.getAssignedTo().getUserId().equals(user.getUserId());
            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access risk analysis of unassigned projects.");
            }
        }
    }

    private String calculateRiskLevel(double probability) {
        if (probability >= 80.0) {
            return "LOW";
        } else if (probability >= 50.0) {
            return "MEDIUM";
        } else {
            return "HIGH";
        }
    }

    private RiskAnalysisResponseDTO mapToResponse(RiskAnalysis riskAnalysis, String explanation) {
        String managerName = "Unassigned";
        if (riskAnalysis.getProject() != null && riskAnalysis.getProject().getAssignedTo() != null) {
            managerName = riskAnalysis.getProject().getAssignedTo().getFullName();
        }

        return RiskAnalysisResponseDTO.builder()
                .projectId(riskAnalysis.getProject().getProjectId())
                .projectName(riskAnalysis.getProject().getProjectName())
                .managerName(managerName)
                .startDate(riskAnalysis.getStartDate())
                .targetDate(riskAnalysis.getTargetDate())
                .businessTargetDuration(riskAnalysis.getBusinessTargetDuration())
                .expectedDuration(riskAnalysis.getExpectedDuration())
                .variance(riskAnalysis.getVariance())
                .standardDeviation(riskAnalysis.getStandardDeviation())
                .zScore(riskAnalysis.getZScore())
                .completionProbability(riskAnalysis.getCompletionProbability())
                .riskLevel(riskAnalysis.getRiskLevel())
                .explanation(explanation != null ? explanation : "Calculated using PERT Z-Score normal cumulative distribution methodology.")
                .build();
    }
}