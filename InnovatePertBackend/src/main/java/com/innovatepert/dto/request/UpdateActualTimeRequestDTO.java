package com.innovatepert.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateActualTimeRequestDTO {

    @NotNull(message = "Actual time is required")
    @PositiveOrZero(message = "Actual time must be zero or a positive value")
    private Double actualTime;
}
