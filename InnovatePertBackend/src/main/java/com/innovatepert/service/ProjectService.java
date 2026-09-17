package com.innovatepert.service;

import java.util.List;

import com.innovatepert.dto.request.ProjectRequest;
import com.innovatepert.dto.response.ProjectResponse;
import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;



public interface ProjectService {

    // FR-11 Create Project
    ProjectResponse createProject(ProjectRequest request);

    // FR-12 Update Project
    ProjectResponse updateProject(Integer projectId, ProjectRequest request);
    
    // Update Project Status
    ProjectResponse updateProjectStatus(Integer projectId, ProjectStatus status);

    // FR-13 Delete Project (Soft Delete)
    void deleteProject(Integer projectId);
    
    // Retrieve Deleted Projects
    List<ProjectResponse> getDeletedProjects();
    
    // Restore Project
    ProjectResponse restoreProject(Integer projectId);
    
    // Hard Delete Project
    void permanentlyDeleteProject(Integer projectId);


    List<ProjectResponse> getAllProjects();

    
    
    ProjectResponse assignProjectManager(Integer projectId, Integer pmUserId);
    
    // Transfer Project
    ProjectResponse transferProject(Integer projectId, Integer newPmUserId);

}