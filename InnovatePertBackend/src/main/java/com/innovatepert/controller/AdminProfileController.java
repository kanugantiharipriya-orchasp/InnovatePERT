package com.innovatepert.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.AdminProfileResponse;
import com.innovatepert.dto.ChangePasswordRequest;
import com.innovatepert.dto.AdminProfileRequest;
import com.innovatepert.service.AdminProfileService;

import jakarta.validation.Valid;
import java.io.IOException;

@RestController
@RequestMapping("/api/admin/profile")
@CrossOrigin(origins = "http://localhost:80803")
@Validated
public class AdminProfileController {

    @Autowired
    private AdminProfileService adminProfileService;

    // =========================================
    // View Profile
    // =========================================
    @GetMapping
    public ResponseEntity<AdminProfileResponse> viewProfile(Authentication authentication) {
        String email = authentication.getName();
        AdminProfileResponse response = adminProfileService.getProfile(email);
        return ResponseEntity.ok(response);
    }

    // =========================================
    // Update Profile
    // =========================================
    @PutMapping("/update")
    public ResponseEntity<String> updateProfile(
            Authentication authentication,
            @Valid @RequestBody AdminProfileRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminProfileService.updateProfile(email, request));
    }

    // =========================================
    // Change Password
    // =========================================
    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminProfileService.changePassword(email, request));
    }
    
    // =========================================
    // Upload Profile Image
    // =========================================
    @PostMapping(value="/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) throws IOException {
        String email = authentication.getName();
        return ResponseEntity.ok(adminProfileService.uploadProfileImage(email, file));
    }
    
    // =========================================
    // Get Profile Image (Added)
    // =========================================
    @GetMapping("/image")
    public ResponseEntity<byte[]> getProfileImage(Authentication authentication) {
        String email = authentication.getName();
        byte[] imageBytes = adminProfileService.getProfileImage(email);

        if (imageBytes == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageBytes);
    }

    // =========================================
    // Remove Profile Image
    // =========================================
    @DeleteMapping("/remove-image")
    public ResponseEntity<String> removeProfileImage(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminProfileService.removeProfileImage(email));
    }
}