package com.innovatepert.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteProjectReportDTO {
    private Integer projectId;
    private String projectName;
    private String projectDescription;
    private LocalDate startDate;
    private LocalDate targetDate;
    private String priority;
    private String status;
    private BigDecimal budget;
    private String managerName;
    private Integer totalTasks;
    private Integer completedTasksCount;
    private Double completionPercentage;
    private Double totalExpectedDuration;
    private Double projectStandardDeviation;
    
    // Will be populated ONLY for Project Managers; null for R&D Directors
    private List<ActivityReportDTO> activities; 
}