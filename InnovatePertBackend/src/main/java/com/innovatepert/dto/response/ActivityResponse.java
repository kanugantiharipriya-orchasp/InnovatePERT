package com.innovatepert.dto.response;

import java.time.LocalDateTime;

import com.innovatepert.enums.ActivityStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private Long activityId;

    private Integer projectId;

    private String projectName;

    private String activityName;

    private String description;

    private Double optimisticTime;

    private Double mostLikelyTime;

    private Double pessimisticTime;

    private Double expectedTime;

    private Double normalCost;

    private Double crashTime;

    private Double crashCost;

    private ActivityStatus status;

    private Long predecessorActivityId;

    private String predecessorActivityName;

    private ActivityStatus predecessorActivityStatus;

    private LocalDateTime createdAt;
}