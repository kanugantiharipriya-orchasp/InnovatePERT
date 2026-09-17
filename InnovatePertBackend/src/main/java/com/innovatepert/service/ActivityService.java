package com.innovatepert.service;

import java.util.List;

import com.innovatepert.dto.request.ActivityRequest;
import com.innovatepert.dto.response.ActivityResponse;
import com.innovatepert.dto.response.ProjectBudgetSummaryResponse;
import com.innovatepert.enums.ActivityStatus;

public interface ActivityService {

    // Create Activity
    ActivityResponse createActivity(ActivityRequest request);

    // Update Activity
    ActivityResponse updateActivity(Long activityId, ActivityRequest request);

    // Update Activity Status
    ActivityResponse updateActivityStatus(Long activityId, ActivityStatus status);

    // Delete Activity
    void deleteActivity(Long activityId);


    // Get All Activities
    List<ActivityResponse> getAllActivities();

    // Get Activities By Project
    List<ActivityResponse> getActivitiesByProject(Integer projectId);


    // Get Budget Summary for a Project
    ProjectBudgetSummaryResponse getBudgetSummary(Integer projectId);

}