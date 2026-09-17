package com.innovatepert.mapper;

import org.springframework.stereotype.Component;

import com.innovatepert.dto.ProjectManagerResponse;
import com.innovatepert.entity.User;


@Component
public class ProjectManagerMapper {

    public ProjectManagerResponse toResponseDTO(User user) {
        if (user == null) {
            return null;
        }

        return ProjectManagerResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .projectCount(user.getProjectCount())
                .createdByAdminId(user.getCreatedByAdmin() != null ? user.getCreatedByAdmin().getUserId() : null)
                .createdByAdminName(user.getCreatedByAdmin() != null ? user.getCreatedByAdmin().getFullName() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
