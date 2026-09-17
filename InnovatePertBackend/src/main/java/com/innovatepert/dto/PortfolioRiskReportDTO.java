package com.innovatepert.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioRiskReportDTO {
    private Integer projectId;
    private String projectName;
    private String status;
    private String priority;
    private String managerName;
    private LocalDate targetDate;
    private BigDecimal expectedDuration;
    private BigDecimal completionProbability;
    private String riskLevel;
}