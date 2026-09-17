package com.innovatepert.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.innovatepert.dto.request.CrashingAnalysisRequestDTO;
import com.innovatepert.dto.response.CrashingAnalysisResponseDTO;
import com.innovatepert.service.CrashingAnalysisService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping
@RequiredArgsConstructor
@CrossOrigin
public class CrashingAnalysisController {

    private final CrashingAnalysisService crashingAnalysisService;

    @PostMapping("/api/v1/crashing-analysis/run")
    public ResponseEntity<CrashingAnalysisResponseDTO> runCrashingAnalysis(
            @Valid @RequestBody CrashingAnalysisRequestDTO request) {
        CrashingAnalysisResponseDTO response = crashingAnalysisService.runCrashingAnalysis(request);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/api/v1/crashing-analysis/submit")
    public ResponseEntity<CrashingAnalysisResponseDTO> submitCrashingAnalysis(
            @Valid @RequestBody CrashingAnalysisResponseDTO request) {
        CrashingAnalysisResponseDTO response = crashingAnalysisService.submitCrashingAnalysis(request);
        return ResponseEntity.ok(response);
    }



    @GetMapping("/api/v1/crashing-analysis/project/{projectId}")
    public ResponseEntity<CrashingAnalysisResponseDTO> getProjectCrashingOverview(
            @PathVariable Integer projectId) {
        CrashingAnalysisResponseDTO response = crashingAnalysisService.getProjectCrashingOverview(projectId);
        return ResponseEntity.ok(response);
    }
}
