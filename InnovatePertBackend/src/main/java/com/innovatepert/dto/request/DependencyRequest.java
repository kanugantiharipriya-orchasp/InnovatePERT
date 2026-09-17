package com.innovatepert.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DependencyRequest {

    @jakarta.validation.constraints.NotNull(message = "Project ID is required")
    private Integer projectId;

    private Integer predecessorProjectId;

    @jakarta.validation.constraints.NotNull(message = "Predecessor activity ID is required")
    private Long predecessorActivityId;

    @jakarta.validation.constraints.NotNull(message = "Successor activity ID is required")
    private Long successorActivityId;

    @jakarta.validation.constraints.NotBlank(message = "Dependency type is required")
    private String dependencyType;

}