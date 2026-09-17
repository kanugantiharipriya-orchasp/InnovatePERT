package com.innovatepert.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private Integer projectId;

    private String projectName;

    private String description;

    private LocalDate startDate;

    private LocalDate targetDate;

    private Priority priority;

    private BigDecimal budget;

    private ProjectStatus status;

    private Double completionProbability;

    private Double projectProgress;

    private Integer assignedById;

    private String assignedByName;

    private Integer assignedToId;
    
    private String pmName;        // (Assigned PM Name)

    private LocalDateTime createdAt;

}