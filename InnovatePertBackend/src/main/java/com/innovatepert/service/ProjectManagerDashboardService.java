package com.innovatepert.service;

import java.util.List;


import com.innovatepert.dto.ActivityStatusResponse;
import com.innovatepert.dto.ProjectManagerDashboardCardsDTO;
import com.innovatepert.dto.ProjectProgressResponse;
import com.innovatepert.dto.ProjectStatusResponse;
import com.innovatepert.dto.RiskOverviewResponse;


public interface ProjectManagerDashboardService {

    ProjectManagerDashboardCardsDTO getDashboardCards();

    List<ProjectStatusResponse> getProjectStatus();

    List<ActivityStatusResponse> getActivityStatus();

    List<ProjectProgressResponse> getProjectProgress();
    List<RiskOverviewResponse> getRiskOverview();

    // Consolidated Unified PM Dashboard scoped to logged-in PM
    com.innovatepert.dto.ConsolidatedPMDashboardDTO getConsolidatedDashboard(com.innovatepert.entity.User manager);
}