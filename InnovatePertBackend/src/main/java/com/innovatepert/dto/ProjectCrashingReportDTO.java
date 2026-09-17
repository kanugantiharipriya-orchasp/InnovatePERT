package com.innovatepert.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCrashingReportDTO {

    private Integer projectId;

    private String projectName;

    private String analysisDate;

    private Double currentDuration;

    private Double targetDuration;

    private Double requiredReduction;

    private Double totalTimeSaved;

    private Double totalAdditionalCost;

    private Integer recommendedActivitiesCount;

    private List<ProjectCrashingItemDTO> activities;
}
