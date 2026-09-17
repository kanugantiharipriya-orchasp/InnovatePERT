package com.innovatepert.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovatepert.dto.ConsolidatedAdminDashboardDTO;
import com.innovatepert.service.AdminDashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    // Consolidated Unified Admin Dashboard API
    @GetMapping("/consolidated")
    public ResponseEntity<ConsolidatedAdminDashboardDTO> getConsolidatedDashboard() {
        return ResponseEntity.ok(dashboardService.getConsolidatedDashboard());
    }

}