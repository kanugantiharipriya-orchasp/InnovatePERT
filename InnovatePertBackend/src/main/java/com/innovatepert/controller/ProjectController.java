package com.innovatepert.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;

import com.innovatepert.dto.request.ProjectRequest;
import com.innovatepert.dto.response.ProjectBudgetSummaryResponse;
import com.innovatepert.dto.response.ProjectResponse;
import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.service.ActivityService;
import com.innovatepert.service.ProjectService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ActivityService activityService;

    // Create Project
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request) {

        return new ResponseEntity<>(
                projectService.createProject(request),
                HttpStatus.CREATED);

    }

    // View All Projects
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {

        return ResponseEntity.ok(
                projectService.getAllProjects());

    }

   

    // Update Project
    @PutMapping("/{projectId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ProjectResponse> updateProject(

            @PathVariable Integer projectId,

            @Valid @RequestBody ProjectRequest request) {

        return ResponseEntity.ok(

                projectService.updateProject(projectId, request));

    }
    
    // Update Project Status
    @PutMapping("/{projectId}/status")
    @PreAuthorize("hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<ProjectResponse> updateProjectStatus(
            @PathVariable Integer projectId,
            @RequestParam ProjectStatus status) {
        return ResponseEntity.ok(projectService.updateProjectStatus(projectId, status));
    }

    // Delete Project (Soft Delete)
    @DeleteMapping("/{projectId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> deleteProject(
            @PathVariable Integer projectId) {

        projectService.deleteProject(projectId);

        return ResponseEntity.ok("Project Deleted Successfully.");

    }

    // Get Deleted Projects
    @GetMapping("/deleted")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getDeletedProjects() {
        return ResponseEntity.ok(projectService.getDeletedProjects());
    }

    // Restore Project
    @PutMapping("/{projectId}/restore")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ProjectResponse> restoreProject(@PathVariable Integer projectId) {
        return ResponseEntity.ok(projectService.restoreProject(projectId));
    }

    // Permanently Delete Project
    @DeleteMapping("/{projectId}/permanent")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> permanentlyDeleteProject(@PathVariable Integer projectId) {
        projectService.permanentlyDeleteProject(projectId);
        return ResponseEntity.ok("Project Permanently Deleted Successfully.");
    }



    // Budget Summary
    @GetMapping("/{projectId}/budget-summary")
    public ResponseEntity<ProjectBudgetSummaryResponse> getBudgetSummary(
            @PathVariable Integer projectId) {

        return ResponseEntity.ok(
                activityService.getBudgetSummary(projectId));

    }

    // Transfer Project
    @PutMapping("/{projectId}/transfer")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ProjectResponse> transferProject(
            @PathVariable Integer projectId,
            @RequestParam Integer newPmUserId) {

        return ResponseEntity.ok(
                projectService.transferProject(projectId, newPmUserId));
    }

}