package com.innovatepert.controller;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovatepert.dto.response.PertResultResponseDTO;
import com.innovatepert.service.PertService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pm/projects/{projectId}")
@RequiredArgsConstructor
public class PertController {

    private final PertService pertService;

    
    @PostMapping("/calculate")
    public ResponseEntity<List<PertResultResponseDTO>> generatePertAnalysis(
            @PathVariable Integer projectId) {
        
        List<PertResultResponseDTO> response = pertService.generateProjectPertAnalysis(projectId);
        return ResponseEntity.ok(response);
    }
    

    /**
     * Get all PERT results for a specific project.
     * GET /api/pm/projects/{projectId}
     */
    @GetMapping
    public ResponseEntity<List<PertResultResponseDTO>> getPertResultsByProject(
            @PathVariable Integer projectId) {
        
        List<PertResultResponseDTO> response = pertService.getPertResultsByProject(projectId);
        return ResponseEntity.ok(response);
    }

    
}