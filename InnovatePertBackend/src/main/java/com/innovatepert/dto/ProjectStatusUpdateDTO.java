package com.innovatepert.dto;

import com.innovatepert.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectStatusUpdateDTO {
    
    @NotNull(message = "New target status is required")
    private ProjectStatus newStatus;
}