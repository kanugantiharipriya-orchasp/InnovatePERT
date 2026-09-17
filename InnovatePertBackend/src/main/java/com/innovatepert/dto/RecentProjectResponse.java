package com.innovatepert.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecentProjectResponse {

    private Integer projectId;

    private String projectName;

    private String projectManagerName;

    private LocalDate targetDate;

    private String status;

    private Double completionPercentage;

    private Double completionProbability;
}