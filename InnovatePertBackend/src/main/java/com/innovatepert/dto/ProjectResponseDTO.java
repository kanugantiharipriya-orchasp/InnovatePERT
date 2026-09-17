package com.innovatepert.dto;

import com.innovatepert.enums.ProjectPriority;
import com.innovatepert.enums.ProjectStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponseDTO {
    private Integer projectId;
    private String projectName;
    private String description;
    private LocalDate startDate;
    private LocalDate targetDate;
    private ProjectPriority priority;
    private BigDecimal budget;
    private ProjectStatus status;
    private Double completionProbability;
    private Double projectProgress;
    private Integer assignedToManagerId;
    private String assignedToManagerName;
    
    // Add Director fields so you can see who created it!
    private Integer assignedByDirectorId;
    private String assignedByDirectorName;
    private LocalDateTime createdAt;
}