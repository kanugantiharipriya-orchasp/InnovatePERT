package com.innovatepert.service.impl;

import java.io.IOException; // Standard Java IO

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Spring Framework transaction
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.AdminProfileResponse;
import com.innovatepert.dto.ChangePasswordRequest;
import com.innovatepert.dto.AdminProfileRequest;
import com.innovatepert.entity.User;
import com.innovatepert.exception.BadRequestException;
import java.util.Arrays;
import java.util.List;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.AdminProfileService;

import java.util.Base64;
import com.innovatepert.security.JwtService;

@Service
public class AdminProfileServiceImpl implements AdminProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Override
    public AdminProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        AdminProfileResponse response = new AdminProfileResponse();
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        
        if (user.getRole() == com.innovatepert.enums.Role.ADMIN) {
            response.setDisplayRole("R&D Director");
        } else {
            response.setDisplayRole(user.getRole().name());
        }

        // Convert the database byte[] into a Base64 String for the DTO response wrapper
        if (user.getProfileImage() != null) {
            String base64Image = Base64.getEncoder().encodeToString(user.getProfileImage());
            response.setProfileImage(base64Image);
        } else {
            response.setProfileImage(null);
        }

        response.setCreatedAt(user.getCreatedAt());

        return response;
    }

    @Override
    public String updateProfile(String email, AdminProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        boolean emailChanged = !user.getEmail().equals(request.getEmail());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        userRepository.save(user);
        
        if (emailChanged) {
            return jwtService.generateToken(user.getEmail(), user.getRole().name());
        }
        return "Profile Updated Successfully";
    }

    @Override
    public String changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

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

    // This method signature now precisely matches the interface definition above
    @Override
    @Transactional
    public String uploadProfileImage(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin Not Found"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select an image");
        }

        String contentType = file.getContentType();
        List<String> allowedTypes = Arrays.asList("image/jpeg", "image/jpg", "image/png");
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file format. Please upload a JPG, JPEG, or PNG image only.");
        }

        user.setProfileImage(file.getBytes());
        userRepository.save(user);

        return "Profile Image Uploaded Successfully";
    }

    @Override
    public byte[] getProfileImage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
                
        return user.getProfileImage();
    }

    @Override
    @Transactional
    public String removeProfileImage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin Not Found"));

        user.setProfileImage(null);
        userRepository.save(user);

        return "Profile Image Removed Successfully";
    }
}