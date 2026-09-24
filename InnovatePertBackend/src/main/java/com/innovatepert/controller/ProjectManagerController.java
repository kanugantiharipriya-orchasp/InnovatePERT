package com.innovatepert.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ProjectManagerRequest;
import com.innovatepert.dto.ProjectManagerResponse;
import com.innovatepert.enums.Status;
import com.innovatepert.service.ProjectManagerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/project-managers") // This is the base URL for this specific controller
@RequiredArgsConstructor
@Slf4j
public class ProjectManagerController {

    // Inject the service layer so the controller can delegate the actual work
    private final ProjectManagerService projectManagerService;

    // HTTP POST is used when we want to CREATE new data in the database
    @PostMapping("/create")
    public ResponseEntity<ProjectManagerResponse> createProjectManager(@Valid @RequestBody ProjectManagerRequest requestDTO) {
        
        log.info("Received request to create Project Manager: {}", requestDTO.getFullName());
        
        // Call the service layer to do the heavy lifting
        ProjectManagerResponse response = projectManagerService.createProjectManager(requestDTO);
        
        // Return a 201 CREATED status code along with the safe Response DTO
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
 // HTTP GET is used to READ data. We map it to the base URL (/api/project-managers)
    @GetMapping
    public ResponseEntity<List<ProjectManagerResponse>> getAllProjectManagers() {
        log.info("Received request to fetch all Project Managers");
        List<ProjectManagerResponse> response = projectManagerService.getAllProjectManagers();
        return new ResponseEntity<>(response, HttpStatus.OK); // Returns 200 OK
    }

    
 // HTTP PUT is used to update an entire existing record
    @PutMapping("/{id}")
    public ResponseEntity<ProjectManagerResponse> updateProjectManager(
            @PathVariable Integer id, 
            @Valid @RequestBody ProjectManagerRequest requestDTO) {
        
        log.info("Received request to update Project Manager ID: {}", id);
        ProjectManagerResponse response = projectManagerService.updateProjectManager(id, requestDTO);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // HTTP PATCH is used to partially update a record (like just flipping a status switch)
    @PatchMapping("/{id}/activate")
    public ResponseEntity<String> activateProjectManager(@PathVariable Integer id) {
        log.info("Received request to activate Project Manager ID: {}", id);
        projectManagerService.activateProjectManager(id);
        return new ResponseEntity<>("Project Manager activated successfully.", HttpStatus.OK);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivateProjectManager(@PathVariable Integer id) {
        log.info("Received request to deactivate Project Manager ID: {}", id);
        projectManagerService.deactivateProjectManager(id);
        return new ResponseEntity<>("Project Manager deactivated successfully.", HttpStatus.OK);
    }

    // HTTP DELETE is mapped to our complete delete logic
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProjectManager(@PathVariable Integer id) {
        log.info("Received request to completely delete Project Manager ID: {}", id);
        projectManagerService.deleteProjectManager(id);
        return new ResponseEntity<>("Project Manager deleted successfully.", HttpStatus.OK);
    }
    
 // URL will look like: /api/project-managers/search?keyword=John
    @GetMapping("/search")
    public ResponseEntity<List<ProjectManagerResponse>> searchProjectManagers(@RequestParam String keyword) {
        log.info("Received request to search Project Managers by keyword: {}", keyword);
        List<ProjectManagerResponse> response = projectManagerService.searchProjectManagers(keyword);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // URL will look like: /api/project-managers/filter?status=ACTIVE
    @GetMapping("/filter")
    public ResponseEntity<List<ProjectManagerResponse>> filterProjectManagers(@RequestParam Status status) {
        log.info("Received request to filter Project Managers by status: {}", status);
        List<ProjectManagerResponse> response = projectManagerService.filterProjectManagersByStatus(status);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<List<ProjectManagerResponse>> uploadProjectManagersExcel(
            @RequestParam("file") MultipartFile file) {
        
        log.info("R&D Director uploading bulk Excel sheet: {}", file.getOriginalFilename());
        List<ProjectManagerResponse> response = projectManagerService.createProjectManagersFromExcel(file);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/upload/template")
    public ResponseEntity<org.springframework.core.io.Resource> downloadTemplate() {
        java.io.ByteArrayInputStream in = com.innovatepert.util.ExcelHelper.generateTemplate();
        org.springframework.core.io.InputStreamResource resource = new org.springframework.core.io.InputStreamResource(in);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ProjectManager_BulkUpload_Template.xlsx")
                .contentType(org.springframework.http.MediaType.parseMediaType(com.innovatepert.util.ExcelHelper.EXCEL_TYPE))
                .body(resource);
    }
}


