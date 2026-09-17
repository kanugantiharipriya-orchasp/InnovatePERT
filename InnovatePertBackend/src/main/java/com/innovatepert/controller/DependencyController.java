package com.innovatepert.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.innovatepert.dto.request.DependencyRequest;
import com.innovatepert.dto.response.DependencyResponse;
import com.innovatepert.service.DependencyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/dependencies")
@RequiredArgsConstructor
public class DependencyController {

    private final DependencyService dependencyService;

    @PostMapping
    public ResponseEntity<DependencyResponse> createDependency(
            @Valid @RequestBody DependencyRequest request) {

        return new ResponseEntity<>(
                dependencyService.createDependency(request),
                HttpStatus.CREATED);
    }


    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DependencyResponse>> getDependenciesByProject(
            @PathVariable Integer projectId) {

        return ResponseEntity.ok(
                dependencyService.getDependenciesByProject(projectId));
    }


    @DeleteMapping("/{dependencyId}")
    public ResponseEntity<String> deleteDependency(
            @PathVariable Long dependencyId) {

        dependencyService.deleteDependency(dependencyId);

        return ResponseEntity.ok("Dependency deleted successfully.");
    }
}