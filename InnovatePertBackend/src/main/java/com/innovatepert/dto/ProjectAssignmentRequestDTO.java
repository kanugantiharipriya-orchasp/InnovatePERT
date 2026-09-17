package com.innovatepert.dto;

import com.innovatepert.enums.ProjectPriority;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAssignmentRequestDTO {

    @NotBlank(message = "Project Name is required")
    @Size(min = 3, max = 100, message = "Project Name must be between 3 and 100 characters")
    private String projectName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Start Date is required")
    @FutureOrPresent(message = "Start Date cannot be in the past")
    private LocalDate startDate;

    @NotNull(message = "Target Date is required")
    @FutureOrPresent(message = "Target Date cannot be in the past")
    private LocalDate targetDate;

    @NotNull(message = "Priority is required")
    private ProjectPriority priority;

    @NotNull(message = "Budget is required")
    @Positive(message = "Budget must be greater than zero")
    private BigDecimal budget;
}