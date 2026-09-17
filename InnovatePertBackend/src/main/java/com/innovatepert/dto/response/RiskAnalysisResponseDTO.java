package com.innovatepert.dto.response;

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
public class RiskAnalysisResponseDTO {

    private Integer projectId;

    private String projectName;

    private String managerName;

    private LocalDate startDate;

    private LocalDate targetDate;

    private BigDecimal businessTargetDuration;

    private BigDecimal expectedDuration;

    private BigDecimal variance;

    private BigDecimal standardDeviation;

    private BigDecimal zScore;

    private BigDecimal completionProbability;

    private String riskLevel;

    private String explanation;
}