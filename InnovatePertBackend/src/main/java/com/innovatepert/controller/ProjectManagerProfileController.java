package com.innovatepert.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ChangeProjectManagerPasswordRequest;
import com.innovatepert.dto.ProjectManagerProfileResponse;
import com.innovatepert.dto.ProjectManagerProfileRequest;
import com.innovatepert.service.ProjectManagerProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projectmanager/profile")
@CrossOrigin(origins = "http://localhost:80803")
@Validated
public class ProjectManagerProfileController {

    @Autowired
    private ProjectManagerProfileService projectManagerProfileService;

    @GetMapping
    public ResponseEntity<ProjectManagerProfileResponse> viewProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(projectManagerProfileService.getProfile(email));
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProjectManagerProfileRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(projectManagerProfileService.updateProfile(email, request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangeProjectManagerPasswordRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(projectManagerProfileService.changePassword(email, request));
    }
    
    // Adjusted path from /profile/upload-image to just /upload-image 
    // full route: /api/projectmanager/profile/upload-image
    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        String email = authentication.getName();
        return ResponseEntity.ok(projectManagerProfileService.uploadProfileImage(email, file));
    }
    
    // Adjusted path from /profile/image to just /image
    // full route: /api/projectmanager/profile/image
    @GetMapping("/image")
    public ResponseEntity<byte[]> getProfileImage(Authentication authentication) {
        String email = authentication.getName();
        
        // Delegate the database lookup logic to the service layer
        byte[] imageBytes = projectManagerProfileService.getProfileImage(email);

        if (imageBytes == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // Change to IMAGE_PNG if applicable
                .body(imageBytes);
    }

    // =========================================
    // Remove Profile Image
    // =========================================
    @DeleteMapping("/remove-image")
    public ResponseEntity<String> removeProfileImage(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(projectManagerProfileService.removeProfileImage(email));
    }
}