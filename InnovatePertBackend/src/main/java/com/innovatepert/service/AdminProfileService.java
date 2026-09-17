package com.innovatepert.service;

import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.AdminProfileResponse;
import com.innovatepert.dto.ChangePasswordRequest;
import com.innovatepert.dto.AdminProfileRequest;

import java.io.IOException;

public interface AdminProfileService {

    // View Profile
    AdminProfileResponse getProfile(String email);

    // Update Profile
    String updateProfile(String email, AdminProfileRequest request);

    // Change Password
    String changePassword(String email, ChangePasswordRequest request);

    String uploadProfileImage(String email, MultipartFile file) throws IOException;
    byte[] getProfileImage(String email);
    String removeProfileImage(String email);
}