package com.innovatepert.service.impl;

import java.io.IOException;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ChangeProjectManagerPasswordRequest;
import com.innovatepert.dto.ProjectManagerProfileResponse;
import com.innovatepert.dto.ProjectManagerProfileRequest;
import com.innovatepert.entity.User;
import com.innovatepert.exception.BadRequestException;
import java.util.Arrays;
import java.util.List;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.ProjectManagerProfileService;

@Service
public class ProjectManagerProfileServiceImpl implements ProjectManagerProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==========================================
    // View Profile
    // ==========================================
    @Override
    public ProjectManagerProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Project Manager Not Found"));
        ProjectManagerProfileResponse response = new ProjectManagerProfileResponse();
        response.setUserId(user.getUserId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        
        // Fetch accurate count of projects assigned to this manager
        int actualProjectCount = (int) projectRepository.countByAssignedTo(user);
        response.setProjectCount(actualProjectCount);
        
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    // ==========================================
    // Update Profile
    // ==========================================
    @Override
    public String updateProfile(String email, ProjectManagerProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Project Manager Not Found"));

        user.setFullName(request.getFullName());
        // Email update is locked for Project Managers.
        userRepository.save(user);
        return "Project Manager Profile Updated Successfully";
    }

    // ==========================================
    // Change Password
    // ==========================================
    @Override
    public String changePassword(String email, ChangeProjectManagerPasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Project Manager Not Found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect.");
        }
        
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from your old password.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return "Password Changed Successfully";
    }
    
 // ==========================================
    // Upload Profile Image
    // ==========================================
    @Override
    @Transactional
    public String uploadProfileImage(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select an image");
        }

        String contentType = file.getContentType();
        List<String> allowedTypes = Arrays.asList("image/jpeg", "image/jpg", "image/png");
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file format. Please upload a JPG, JPEG, or PNG image only.");
        }

        // Passes raw byte[] directly to setProfileImage(byte[])
        user.setProfileImage(file.getBytes());

        userRepository.save(user);
        return "Profile Image Uploaded Successfully";
    }
    
    // ==========================================
    // Get Profile Image
    // ==========================================
    @Override
    public byte[] getProfileImage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
                
        // Safely returns byte[] directly to the controller
        return user.getProfileImage(); 
    }

    // ==========================================
    // Remove Profile Image
    // ==========================================
    @Override
    @Transactional
    public String removeProfileImage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Project Manager Not Found"));

        user.setProfileImage(null);
        userRepository.save(user);

        return "Profile Image Removed Successfully";
    }
}