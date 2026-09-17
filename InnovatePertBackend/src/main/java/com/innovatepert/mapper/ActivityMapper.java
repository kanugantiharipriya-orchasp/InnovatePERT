package com.innovatepert.mapper;

import org.springframework.stereotype.Component;

import com.innovatepert.dto.request.ActivityRequest;
import com.innovatepert.dto.response.ActivityResponse;
import com.innovatepert.entity.Activity;

@Component
public class ActivityMapper {

    // Request DTO -> Entity
    public Activity toEntity(ActivityRequest request) {

        return Activity.builder()
                .activityName(request.getActivityName())
//                .description(request.getDescription())
                .optimisticTime(request.getOptimisticTime())
                .mostLikelyTime(request.getMostLikelyTime())
                .pessimisticTime(request.getPessimisticTime())
                .normalCost(request.getNormalCost())
                .crashTime(request.getCrashTime())
                .crashCost(request.getCrashCost())
                .build();
    }

    // Entity -> Response DTO
    public ActivityResponse toResponse(Activity activity) {

        return ActivityResponse.builder()
                .activityId(activity.getActivityId())
                .projectId(activity.getProject().getProjectId())
                .projectName(activity.getProject().getProjectName())
                .activityName(activity.getActivityName())
//                .description(activity.getDescription())
                .optimisticTime(activity.getOptimisticTime())
                .mostLikelyTime(activity.getMostLikelyTime())
                .pessimisticTime(activity.getPessimisticTime())
                .expectedTime(activity.getExpectedTime())
//                .variance(activity.getVariance())
              //  .normalTime(activity.getNormalTime())
                .normalCost(activity.getNormalCost())
                .crashTime(activity.getCrashTime())
                .crashCost(activity.getCrashCost())
                .status(activity.getStatus())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}