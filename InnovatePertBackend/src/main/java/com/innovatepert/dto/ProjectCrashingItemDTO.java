package com.innovatepert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCrashingItemDTO {

    private Integer priority;

    private String activityName;

    private Double normalTime;

    private Double crashTime;

    private Double timeSaved;

    private Double normalCost;

    private Double crashCost;

    private Double additionalCost;

    private Double costSlope;

    private String recommendation;
}
