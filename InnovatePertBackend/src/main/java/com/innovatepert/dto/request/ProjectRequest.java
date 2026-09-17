package com.innovatepert.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

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
public class ProjectRequest {

    @jakarta.validation.constraints.NotBlank(message = "Project name is required")
    @jakarta.validation.constraints.Size(min = 2, max = 100, message = "Project name must be between 2 and 100 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9 _&\\.\\(\\)/#\\+\\-]+$", message = "Project name contains invalid characters")
    @jakarta.validation.constraints.Pattern(regexp = "^(?!.*  ).*", message = "Multiple consecutive spaces are not allowed")
    private String projectName;

    @jakarta.validation.constraints.Size(max = 500, message = "Description cannot exceed 500 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^(?!.*  ).*$", message = "Multiple consecutive spaces are not allowed")
    private String description;

    @jakarta.validation.constraints.NotNull(message = "Start date is required")
    private LocalDate startDate;

    @jakarta.validation.constraints.NotNull(message = "Target date is required")
    private LocalDate targetDate;

    private Priority priority;

    @jakarta.validation.constraints.NotNull(message = "Budget is required")
    @jakarta.validation.constraints.PositiveOrZero(message = "Budget must be zero or positive")
    private BigDecimal budget;


   // private Integer createdById;

  // private Integer assignedById;

    private Integer assignedToId;
    
    private ProjectStatus status;

}