package com.innovatepert.dto;

import lombok.Data;

@Data
public class ProjectManagerPerformanceResponse {

    private String managerName;

    private long totalProjects;

    private long completedProjects;

    private long inProgressProjects;

    private long notStartedProjects;

}