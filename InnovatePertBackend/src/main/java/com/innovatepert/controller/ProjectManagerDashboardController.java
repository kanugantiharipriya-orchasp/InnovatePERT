package com.innovatepert.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovatepert.dto.ConsolidatedPMDashboardDTO;
import com.innovatepert.entity.User;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.ProjectManagerDashboardService;

@RestController
@RequestMapping("/api/pm/dashboard")
@RequiredArgsConstructor
public class ProjectManagerDashboardController {

    private final ProjectManagerDashboardService dashboardService;
    private final UserRepository userRepository;

    // Consolidated Unified PM Dashboard API
    @GetMapping("/consolidated")
    public ResponseEntity<ConsolidatedPMDashboardDTO> getConsolidatedDashboard(Authentication authentication) {
        User manager = null;
        if (authentication != null && authentication.getName() != null) {
            manager = userRepository.findByEmail(authentication.getName()).orElse(null);
        }
        return ResponseEntity.ok(dashboardService.getConsolidatedDashboard(manager));
    }
}