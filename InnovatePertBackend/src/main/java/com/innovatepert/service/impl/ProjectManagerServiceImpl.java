package com.innovatepert.service.impl;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ProjectManagerRequest;
import com.innovatepert.dto.ProjectManagerResponse;
import com.innovatepert.entity.User;
import com.innovatepert.enums.Role;
import com.innovatepert.enums.Status;
import com.innovatepert.exception.AccessDeniedException;
import com.innovatepert.exception.BadRequestException;
import com.innovatepert.exception.DuplicateEmailException;
import com.innovatepert.exception.ResourceNotFoundException;
import com.innovatepert.mapper.ProjectManagerMapper;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.EmailService;
import com.innovatepert.service.ProjectManagerService;
import com.innovatepert.util.ExcelHelper;
import com.innovatepert.util.PasswordGeneratorUtil;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Builder
@Slf4j
public class ProjectManagerServiceImpl implements ProjectManagerService {

	private final UserRepository userRepository;
	private final ProjectManagerMapper projectManagerMapper;
	private final PasswordEncoder passwordEncoder;
	private final EmailService emailService;

	// =========================================================================
	// HELPER: EXTRACT CURRENT LOGGED-IN R&D DIRECTOR
	// =========================================================================
	private User getLoggedInDirector() {
		var authentication = org.springframework.security.core.context.SecurityContextHolder
				.getContext()
				.getAuthentication();

		if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
			log.error("Access Denied: Unauthenticated attempt to invoke service method.");
			throw new AccessDeniedException("You must be logged in as an R&D Director to perform this operation.");
		}

		String loggedInAdminEmail = authentication.getName();
		return userRepository.findByEmail(loggedInAdminEmail)
				.orElseThrow(() -> new ResourceNotFoundException("Logged-in R&D Director not found in system with email: " + loggedInAdminEmail));
	}

	// =========================================================================
	// HELPER: ENFORCE DATA OWNERSHIP (PREVENT DIRECT CROSS-TENANT ACCESS)
	// =========================================================================
	private void verifyManagerOwnership(User manager, User director) {
		if (director == null || manager.getCreatedByAdmin() == null || 
			!manager.getCreatedByAdmin().getUserId().equals(director.getUserId())) {
			log.error("SECURITY ALERT: Director ID {} attempted unauthorized access to Manager ID {} created by Director ID {}",
					director != null ? director.getUserId() : "NULL", manager.getUserId(), 
					manager.getCreatedByAdmin() != null ? manager.getCreatedByAdmin().getUserId() : "NULL");
			throw new AccessDeniedException("Access Denied: You do not have permission to view or modify this Project Manager.");
		}
	}

	@Override
	@Transactional
	public ProjectManagerResponse createProjectManager(ProjectManagerRequest requestDTO) {
		log.info("Attempting to create Project Manager with email: {}", requestDTO.getEmail());

		if (userRepository.existsByEmail(requestDTO.getEmail())) {
			log.error("Creation failed: Email {} already exists", requestDTO.getEmail());
			throw new DuplicateEmailException("A user with this email already exists in the system.");
		}

		String unencryptedPassword = PasswordGeneratorUtil.generateRandomPassword();
		String hashedPassword = passwordEncoder.encode(unencryptedPassword);

		// Dynamically extract logged-in director
		User admin = getLoggedInDirector();

		User newUser = User.builder()
				.fullName(requestDTO.getFullName())
				.email(requestDTO.getEmail())
				.password(hashedPassword)
				.role(Role.PROJECT_MANAGER)
				.status(Status.ACTIVE)
				.projectCount(0)
				.createdByAdmin(admin) // Binds manager strictly to this director
				.build();

		User savedUser = userRepository.save(newUser);
		log.info("Successfully saved Project Manager ID: {} under Director ID: {}", savedUser.getUserId(), admin.getUserId());

		try {
			emailService.sendProjectManagerCredentials(savedUser.getEmail(), savedUser.getFullName(), unencryptedPassword);
			log.info("Successfully sent welcome email to {}", savedUser.getEmail());
		} catch (Exception e) {
			log.error("Failed to send email to {}. Error: {}", savedUser.getEmail(), e.getMessage());
		}

		return projectManagerMapper.toResponseDTO(savedUser);
	}

	@Override
	public List<ProjectManagerResponse> getAllProjectManagers() {
		User loggedInDirector = getLoggedInDirector();
		log.info("Fetching Project Managers for Director ID: {}", loggedInDirector.getUserId());

		List<User> projectManagers = userRepository.findByRoleAndCreatedByAdmin(Role.PROJECT_MANAGER, loggedInDirector);

		return projectManagers.stream()
				.map(projectManagerMapper::toResponseDTO)
				.toList();
	}


	@Override
	@Transactional
	public ProjectManagerResponse updateProjectManager(Integer id, ProjectManagerRequest requestDTO) {
		User loggedInDirector = getLoggedInDirector();
		log.info("Updating Project Manager ID: {} by Director ID: {}", id, loggedInDirector.getUserId());

		User existingUser = userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Project Manager not found with ID: " + id));

		// Verify ownership before modification
		verifyManagerOwnership(existingUser, loggedInDirector);

		boolean nameChanged = !existingUser.getFullName().equals(requestDTO.getFullName());
        boolean emailChanged = !existingUser.getEmail().equals(requestDTO.getEmail());
        StringBuilder changedFieldsBuilder = new StringBuilder();

        if (emailChanged && userRepository.existsByEmail(requestDTO.getEmail())) {
            log.error("Update failed: Email {} is already in use", requestDTO.getEmail());
            throw new DuplicateEmailException("This email is already registered to another user.");
        }

        if (nameChanged) {
            changedFieldsBuilder.append("**Name**\n");
            changedFieldsBuilder.append("* Previous Name: `").append(existingUser.getFullName()).append("`\n");
            changedFieldsBuilder.append("* Updated Name: `").append(requestDTO.getFullName()).append("`\n\n");
        }
        if (emailChanged) {
            changedFieldsBuilder.append("**Email**\n");
            changedFieldsBuilder.append("* Previous Email: `").append(existingUser.getEmail()).append("`\n");
            changedFieldsBuilder.append("* Updated Email: `").append(requestDTO.getEmail()).append("`\n\n");
        }

        existingUser.setFullName(requestDTO.getFullName());
        existingUser.setEmail(requestDTO.getEmail());

        User updatedUser = userRepository.save(existingUser);
        
        if (nameChanged || emailChanged) {
            try {
                // Send to the NEW email address so they have access
                emailService.sendProjectManagerProfileUpdateNotification(
                    updatedUser.getEmail(), 
                    updatedUser.getFullName(), 
                    changedFieldsBuilder.toString().trim()
                );
            } catch (Exception e) {
                log.error("Failed to send profile update email to {}: {}", updatedUser.getEmail(), e.getMessage());
            }
        }
        
        log.info("Successfully updated Project Manager ID: {}", id);
        return projectManagerMapper.toResponseDTO(updatedUser);
	}

	@Override
	@Transactional
	public void activateProjectManager(Integer id) {
		changeUserStatus(id, Status.ACTIVE);
	}

	@Override
	@Transactional
	public void deactivateProjectManager(Integer id) {
		changeUserStatus(id, Status.INACTIVE);
	}

	@Override
	@Transactional
	public void deleteProjectManager(Integer id) {
		User loggedInDirector = getLoggedInDirector();

		User user = userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Project Manager not found with ID: " + id));

		// Verify ownership before deleting
		verifyManagerOwnership(user, loggedInDirector);

		userRepository.delete(user);
	}

	private void changeUserStatus(Integer id, Status newStatus) {
		User loggedInDirector = getLoggedInDirector();

		User user = userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Project Manager not found with ID: " + id));

		// Verify ownership before changing status
		verifyManagerOwnership(user, loggedInDirector);

		if (user.getStatus() == Status.DELETED) {
			throw new BadRequestException("Cannot change status of a deleted Project Manager.");
		}

		user.setStatus(newStatus);
		userRepository.save(user);
		log.info("Changed status of Project Manager ID: {} to {} by Director ID: {}", id, newStatus, loggedInDirector.getUserId());
	}

	@Override
	public List<ProjectManagerResponse> searchProjectManagers(String keyword) {
		User loggedInDirector = getLoggedInDirector();
		log.info("Searching Project Managers with keyword '{}' for Director ID: {}", keyword, loggedInDirector.getUserId());

		// Search strictly within this Director's managers
		List<User> users = userRepository.findByRoleAndCreatedByAdminAndFullNameContainingIgnoreCase(
				Role.PROJECT_MANAGER, loggedInDirector, keyword);

		return users.stream().map(projectManagerMapper::toResponseDTO).toList();
	}

	@Override
	public List<ProjectManagerResponse> filterProjectManagersByStatus(Status status) {
		User loggedInDirector = getLoggedInDirector();
		log.info("Filtering Project Managers by status '{}' for Director ID: {}", status, loggedInDirector.getUserId());

		// Filter status strictly within this Director's managers
		List<User> users = userRepository.findByRoleAndCreatedByAdminAndStatus(
				Role.PROJECT_MANAGER, loggedInDirector, status);

		return users.stream().map(projectManagerMapper::toResponseDTO).toList();
	}

	@Override
	@Transactional
	public List<ProjectManagerResponse> createProjectManagersBulk(List<ProjectManagerRequest> requests) {
		log.info("Attempting bulk creation for {} Project Managers", requests.size());

		User admin = getLoggedInDirector();

		List<User> newUsers = new java.util.ArrayList<>();
		List<String> unencryptedPasswords = new java.util.ArrayList<>();

		for (ProjectManagerRequest requestDTO : requests) {
			String tempPassword = PasswordGeneratorUtil.generateRandomPassword();
			unencryptedPasswords.add(tempPassword);

			User newUser = User.builder()
					.fullName(requestDTO.getFullName())
					.email(requestDTO.getEmail())
					.password(passwordEncoder.encode(tempPassword))
					.role(Role.PROJECT_MANAGER)
					.status(Status.ACTIVE)
					.projectCount(0)
					.createdByAdmin(admin)
					.build();

			newUsers.add(newUser);
		}

		List<User> savedUsers = userRepository.saveAll(newUsers);
		log.info("Successfully saved {} Project Managers in bulk for Director ID: {}", savedUsers.size(), admin.getUserId());

		for (int i = 0; i < savedUsers.size(); i++) {
			User savedUser = savedUsers.get(i);
			String rawPassword = unencryptedPasswords.get(i);
			try {
				emailService.sendProjectManagerCredentials(savedUser.getEmail(), savedUser.getFullName(), rawPassword);
				log.info("Welcome email sent to {}", savedUser.getEmail());
			} catch (Exception e) {
				log.error("Failed to send bulk welcome email to {}: {}", savedUser.getEmail(), e.getMessage());
			}
		}

		return savedUsers.stream()
				.map(projectManagerMapper::toResponseDTO)
				.toList();
	}

	@Override
	@Transactional
	public List<ProjectManagerResponse> createProjectManagersFromExcel(MultipartFile file) {
		log.info("Processing Excel upload for bulk Project Manager onboarding: {}", file.getOriginalFilename());

		if (!ExcelHelper.hasExcelFormat(file)) {
			throw new BadRequestException("Invalid file format! Please upload a valid Microsoft Excel file (.xlsx or .xls).");
		}

		try {
			List<ProjectManagerRequest> extractedRequests = ExcelHelper.parseExcelFile(file.getInputStream(), userRepository::existsByEmail);

			if (extractedRequests.isEmpty()) {
				throw new BadRequestException("The uploaded Excel sheet is empty or contains no valid data rows.");
			}

			log.info("Successfully extracted {} real manager profiles from Excel sheet.", extractedRequests.size());

			return createProjectManagersBulk(extractedRequests);

		} catch (java.io.IOException e) {
			log.error("Failed to read Excel stream: {}", e.getMessage());
			throw new BadRequestException("Could not read Excel file data: " + e.getMessage());
		}
	}
}