package com.innovatepert.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrashingAnalysisRequestDTO {

    @jakarta.validation.constraints.NotNull(message = "Project ID is required")
    private Integer projectId;

    @jakarta.validation.constraints.NotNull(message = "Target duration is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Target duration must be zero or a positive value")
    private Double newTargetDuration;
}
