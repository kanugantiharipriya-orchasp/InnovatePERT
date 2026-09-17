package com.innovatepert.service;

import java.util.List;

import com.innovatepert.dto.request.UpdateActualTimeRequestDTO;
import com.innovatepert.dto.response.PertResultResponseDTO;

public interface PertService {

    /**
     * Generates or updates PERT analysis results for all activities in a project.
     */
    List<PertResultResponseDTO> generateProjectPertAnalysis(Integer projectId);

    /**
     * Retrieves all calculated PERT results for a specific project.
     */
    List<PertResultResponseDTO> getPertResultsByProject(Integer projectId);

    
}