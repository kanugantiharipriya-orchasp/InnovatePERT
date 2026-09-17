package com.innovatepert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityReportDTO {
    private Long activityId;
    private String activityName;
    private String description;
    private Double optimisticTime;
    private Double mostLikelyTime;
    private Double pessimisticTime;
    private Double expectedTime;
    private Double normalCost;
    private String status;
}