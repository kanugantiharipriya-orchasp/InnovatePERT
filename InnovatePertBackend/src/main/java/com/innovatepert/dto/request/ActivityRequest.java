package com.innovatepert.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityRequest {

    @jakarta.validation.constraints.NotNull(message = "Project ID is required")
    private Integer projectId;

    @jakarta.validation.constraints.NotBlank(message = "Activity name is required")
    @jakarta.validation.constraints.Size(min = 2, max = 100, message = "Activity name must be between 2 and 100 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9 _&\\.\\(\\)/#\\+\\-]+$", message = "Activity name contains invalid characters")
    @jakarta.validation.constraints.Pattern(regexp = "^(?!.*  ).*", message = "Multiple consecutive spaces are not allowed")
    private String activityName;

    @jakarta.validation.constraints.Size(max = 500, message = "Description cannot exceed 500 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^(?!.*  ).*$", message = "Multiple consecutive spaces are not allowed")
    private String description;

    @jakarta.validation.constraints.NotNull(message = "Optimistic time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Optimistic time must be positive or zero")
    private Double optimisticTime;

    @jakarta.validation.constraints.NotNull(message = "Most likely time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Most likely time must be positive or zero")
    private Double mostLikelyTime;

    @jakarta.validation.constraints.NotNull(message = "Pessimistic time is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Pessimistic time must be positive or zero")
    private Double pessimisticTime;

    @jakarta.validation.constraints.PositiveOrZero(message = "Normal cost must be positive or zero")
    private Double normalCost;

    @jakarta.validation.constraints.PositiveOrZero(message = "Crash time must be positive or zero")
    private Double crashTime;

    @jakarta.validation.constraints.PositiveOrZero(message = "Crash cost must be positive or zero")
    private Double crashCost;

    private Long predecessorActivityId;
}