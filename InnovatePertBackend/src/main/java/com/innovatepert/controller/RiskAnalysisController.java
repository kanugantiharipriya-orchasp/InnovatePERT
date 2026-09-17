package com.innovatepert.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovatepert.dto.response.ProjectDropdownResponseDTO;
import com.innovatepert.dto.response.RiskAnalysisResponseDTO;
import com.innovatepert.service.RiskAnalysisService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskAnalysisController {

    private final RiskAnalysisService riskAnalysisService;

    // Project Manager 
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectDropdownResponseDTO>> getAssignedProjects(Principal principal) {
        String email = principal.getName();
        return ResponseEntity.ok(riskAnalysisService.getAssignedProjects(email));
    }

    // Project ID
    @GetMapping("/{projectId}")
    public ResponseEntity<RiskAnalysisResponseDTO> analyzeProject(@PathVariable Integer projectId) {
        return ResponseEntity.ok(riskAnalysisService.analyzeProject(projectId));
    }

    // 🔴 NEW: R&D Director (Admin) 
    @GetMapping("/director/all-assessments")
    public ResponseEntity<List<RiskAnalysisResponseDTO>> getAllDirectorRiskAssessments() {
      
        return ResponseEntity.ok(riskAnalysisService.getAllProjectRiskAssessments()); 
    }
}