package com.innovatepert.mapper;

import org.springframework.stereotype.Component;

import com.innovatepert.dto.request.ProjectRequest;
import com.innovatepert.dto.response.ProjectResponse;
import com.innovatepert.entity.Project;

@Component
public class ProjectMapper {

	public Project toEntity(ProjectRequest request) {

	    if (request == null) {
	        return null;
	    }

	    return Project.builder()
	            .projectName(request.getProjectName())
	            .description(request.getDescription())
	            .startDate(request.getStartDate())
	            .targetDate(request.getTargetDate())
	            .priority(request.getPriority())
	            .budget(request.getBudget())
	            .build();
	}

    public ProjectResponse toResponse(Project project) {

        if (project == null) {
            return null;
        }

        return ProjectResponse.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .targetDate(project.getTargetDate())
                .priority(project.getPriority())
                .budget(project.getBudget())
                .status(project.getStatus())
                .completionProbability(project.getCompletionProbability() != null ? project.getCompletionProbability() : 0.0)
                .projectProgress(project.getProjectProgress() != null ? project.getProjectProgress() : 0.0)
                .assignedById(project.getAssignedBy() != null ? project.getAssignedBy().getUserId() : null)
                .assignedToId(project.getAssignedTo() != null ? project.getAssignedTo().getUserId() : null)
                .pmName(project.getAssignedTo() != null ? project.getAssignedTo().getFullName() : "Unassigned") // Added PM Name
                .createdAt(project.getCreatedAt())
                .build();
    }

}