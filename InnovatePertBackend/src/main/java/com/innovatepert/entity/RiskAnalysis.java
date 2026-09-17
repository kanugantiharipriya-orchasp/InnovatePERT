package com.innovatepert.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "risk_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_id")
    private Integer riskId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "business_target_duration", nullable = false, precision = 10, scale = 2)
    private BigDecimal businessTargetDuration;

    @Column(name = "expected_duration", nullable = false, precision = 10, scale = 2)
    private BigDecimal expectedDuration;

    @Column(name = "variance", nullable = false, precision = 10, scale = 2)
    private BigDecimal variance;

    @Column(name = "standard_deviation", nullable = false, precision = 10, scale = 2)
    private BigDecimal standardDeviation;

    @Column(name = "z_score", nullable = false, precision = 10, scale = 4)
    private BigDecimal zScore;

    @Column(name = "completion_probability", nullable = false, precision = 5, scale = 2)
    private BigDecimal completionProbability;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    @Column(name = "analyzed_at", nullable = false)
    private LocalDateTime analyzedAt;
}