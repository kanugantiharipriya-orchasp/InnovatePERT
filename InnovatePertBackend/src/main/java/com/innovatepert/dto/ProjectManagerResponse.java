package com.innovatepert.dto;

import java.time.LocalDateTime;

import com.innovatepert.enums.Role;
import com.innovatepert.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectManagerResponse {
	// Notice we do NOT include the password here!
    private Integer userId;
    private String fullName;
    private String email;
    private Role role;
    private Status status;
    private Integer createdByAdminId;
    private String createdByAdminName;
    private Integer projectCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
	
}
