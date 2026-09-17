package com.innovatepert.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrashingAnalysisResponseDTO {

    private Integer projectId;

    private String projectName;

    private Double currentDuration;

    private Double maxPossibleReduction;

    private Double minAchievableDuration;

    private Double newTargetDuration;

    private Double requiredReduction;

    private Double totalTimeSaved;

    private Double totalAdditionalCost;

    private List<CrashActivityResponseDTO> activities;
}
