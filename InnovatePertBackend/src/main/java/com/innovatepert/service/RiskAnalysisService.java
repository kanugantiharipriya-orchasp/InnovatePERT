package com.innovatepert.service;

import java.util.List;
import com.innovatepert.dto.response.ProjectDropdownResponseDTO;
import com.innovatepert.dto.response.RiskAnalysisResponseDTO;

public interface RiskAnalysisService {

    List<ProjectDropdownResponseDTO> getAssignedProjects(String email);

    RiskAnalysisResponseDTO analyzeProject(Integer projectId);

  
    List<RiskAnalysisResponseDTO> getAllProjectRiskAssessments();
}