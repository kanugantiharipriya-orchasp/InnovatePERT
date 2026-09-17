package com.innovatepert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectManagerReportDTO {
    private Integer managerId;
    private String fullName;
    private String email;
    private String status;
    private Integer projectCount;
}