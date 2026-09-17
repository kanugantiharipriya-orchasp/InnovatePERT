package com.innovatepert.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardSummaryResponse {

    private long totalProjects;

    private long activeProjects;

    private long totalProjectManagers;

    private long projectsAtRisk;

}