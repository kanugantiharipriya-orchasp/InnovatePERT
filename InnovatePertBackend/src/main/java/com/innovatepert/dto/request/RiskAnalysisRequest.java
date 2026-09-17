package com.innovatepert.dto.request;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAnalysisRequest {

    @jakarta.validation.constraints.NotNull(message = "Project ID is required")
    private Long projectId;

    @jakarta.validation.constraints.NotNull(message = "Optimistic time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Optimistic time must be positive or zero")
    private BigDecimal optimisticTime;

    @jakarta.validation.constraints.NotNull(message = "Most likely time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Most likely time must be positive or zero")
    private BigDecimal mostLikelyTime;

    @jakarta.validation.constraints.NotNull(message = "Pessimistic time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Pessimistic time must be positive or zero")
    private BigDecimal pessimisticTime;

    @jakarta.validation.constraints.NotNull(message = "Target duration is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Target duration must be positive or zero")
    private BigDecimal targetDuration;
}