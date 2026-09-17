package com.innovatepert.service;

import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ChangeProjectManagerPasswordRequest;
import com.innovatepert.dto.ProjectManagerProfileResponse;
import com.innovatepert.dto.ProjectManagerProfileRequest;

import java.io.IOException;

public interface ProjectManagerProfileService {

    // View Profile
    ProjectManagerProfileResponse getProfile(String email);

    // Update Profile
    String updateProfile(String email, ProjectManagerProfileRequest request);

    // Change Password
    String changePassword(String email, ChangeProjectManagerPasswordRequest request);
    
    String uploadProfileImage(String email, MultipartFile file) throws IOException;
    byte[] getProfileImage(String email);
    String removeProfileImage(String email);

}