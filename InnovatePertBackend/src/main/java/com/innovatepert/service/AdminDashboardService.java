package com.innovatepert.service;

import java.util.List;

import com.innovatepert.dto.AdminDashboardResponse;
import com.innovatepert.dto.AdminDashboardSummaryResponse;
import com.innovatepert.dto.ProjectStatusResponse;
import com.innovatepert.dto.ProjectPriorityResponse;
import com.innovatepert.dto.RiskOverviewResponse;
import com.innovatepert.dto.RecentProjectResponse;
import com.innovatepert.dto.ProjectManagerPerformanceResponse;

public interface AdminDashboardService {


    // Dashboard Summary Cards
    AdminDashboardSummaryResponse getDashboardSummary();


    // Project Status Distribution
    List<ProjectStatusResponse> getProjectStatus();


    // Project Priority Distribution
    List<ProjectPriorityResponse> getProjectPriority();


    // Risk Overview
    List<RiskOverviewResponse> getRiskOverview();


    // Recent Projects
    List<RecentProjectResponse> getRecentProjects();


    // Project Manager Performance
    List<ProjectManagerPerformanceResponse> getProjectManagerPerformance();


    // Complete Dashboard
    AdminDashboardResponse getDashboard();

    // Consolidated Unified Admin Dashboard
    com.innovatepert.dto.ConsolidatedAdminDashboardDTO getConsolidatedDashboard();
}