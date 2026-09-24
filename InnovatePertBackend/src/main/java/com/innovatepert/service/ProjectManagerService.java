package com.innovatepert.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ProjectManagerRequest;
import com.innovatepert.dto.ProjectManagerResponse;
import com.innovatepert.enums.Status;

public interface ProjectManagerService {
	ProjectManagerResponse createProjectManager(ProjectManagerRequest requestDTO);

	List<ProjectManagerResponse> getAllProjectManagers();
    
 // UPDATE
    ProjectManagerResponse updateProjectManager(Integer id, ProjectManagerRequest requestDTO);
    
    // STATE MANAGEMENT
    void activateProjectManager(Integer id);
    void deactivateProjectManager(Integer id);
    void deleteProjectManager(Integer id);
    
 // SEARCH & FILTER
    List<ProjectManagerResponse> searchProjectManagers(String keyword);
    List<ProjectManagerResponse> filterProjectManagersByStatus(Status status);
    
 // NEW: Onboard Project Managers by uploading an Excel Sheet
    List<ProjectManagerResponse> createProjectManagersBulk(List<ProjectManagerRequest> requests);
    
    List<ProjectManagerResponse> createProjectManagersFromExcel(MultipartFile file);
}
