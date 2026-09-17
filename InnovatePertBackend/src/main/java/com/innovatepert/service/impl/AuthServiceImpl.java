package com.innovatepert.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.innovatepert.dto.ForgotPasswordRequest;
import com.innovatepert.dto.LoginRequest;
import com.innovatepert.dto.LoginResponse;
import com.innovatepert.dto.RegisterRequest;
import com.innovatepert.dto.RegisterResponse;
import com.innovatepert.dto.ResetPasswordRequest;
import com.innovatepert.dto.VerifyOtpRequest;
import com.innovatepert.entity.User;
import com.innovatepert.enums.Role;
import com.innovatepert.enums.Status;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.security.JwtService;
import com.innovatepert.service.AuthService;
import com.innovatepert.service.EmailService;

@Service
public class AuthServiceImpl implements AuthService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtService jwtService;

	@Autowired
	private EmailService emailService;

	// ================= REGISTER =================

	@Override
	public RegisterResponse register(RegisterRequest request) {

		if (userRepository.existsByEmail(request.getEmail())) {
			return new RegisterResponse("Email already exists");
		}

		if (!request.getPassword().equals(request.getConfirmPassword())) {
			return new RegisterResponse("Password and Confirm Password do not match");
		}

		User user = new User();

		user.setFullName(request.getFullName());
		user.setEmail(request.getEmail());
		user.setPassword(passwordEncoder.encode(request.getPassword()));

		if (request.getRole() == Role.PROJECT_MANAGER) {
			return new RegisterResponse("Project Managers cannot self-register. They must be created by an R&D Director.");
		}
		// Set role
		user.setRole(request.getRole() != null ? request.getRole() : Role.ADMIN);

		// Set default status
		user.setStatus(Status.ACTIVE);

		user.setProjectCount(0);

		user.setCreatedAt(LocalDateTime.now());
		user.setUpdatedAt(LocalDateTime.now());

		user.setOtp(null);
		user.setOtpExpiry(null);
		user.setOtpVerified(false);

		userRepository.save(user);

		return new RegisterResponse("User Registered Successfully");
	}


	// ================= LOGIN =================
	// ================= LOGIN =================

	@Override
	public LoginResponse login(LoginRequest request) {

	    Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

	    if (optionalUser.isEmpty()) {
	        throw new BadCredentialsException("Invalid email or password");
	    }

	    User user = optionalUser.get();

	    // Check Password
	    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
	        throw new BadCredentialsException("Invalid email or password");
	    }

	    // Check User Status
	    if (user.getStatus() != Status.ACTIVE) {
	        return new LoginResponse("Account is Inactive");
	    }

	    // Generate JWT Token
		String roleName = user.getRole() != null ? user.getRole().name() : "USER";
	    String token = jwtService.generateToken(user.getEmail(), roleName);
		LoginResponse response = new LoginResponse();

		response.setMessage("Login Successful");
		response.setUserId(user.getUserId());
		response.setFullName(user.getFullName());
		response.setEmail(user.getEmail());
		response.setRole(user.getRole());
		response.setToken(token);

		return response;
	}
	

	// ================= FORGOT PASSWORD =================

	@Override
	public String forgotPassword(ForgotPasswordRequest request) {

		Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

		if (optionalUser.isEmpty()) {
			throw new IllegalArgumentException("No account was found for this email address.");
		}

		User user = optionalUser.get();

		String otp = generateOtp();

		user.setOtp(otp);
		user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
		user.setOtpVerified(false);

		userRepository.save(user);

		emailService.sendOtpEmail(user.getEmail(), otp);

		return "OTP Sent Successfully";
	}

	// ================= VERIFY OTP =================

	@Override
	public String verifyOtp(VerifyOtpRequest request) {

		Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

		if (optionalUser.isEmpty()) {
			throw new IllegalArgumentException("No account was found for this email address.");
		}

		User user = optionalUser.get();

		if (user.getOtp() == null) {
			throw new IllegalArgumentException("OTP not generated.");
		}

		if (!user.getOtp().equals(request.getOtp())) {
			throw new IllegalArgumentException("Invalid OTP.");
		}

		if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
			throw new IllegalArgumentException("OTP Expired.");
		}

		user.setOtpVerified(true);

		userRepository.save(user);

		return "OTP Verified Successfully";
	}

	// ================= RESET PASSWORD =================

	@Override
	public String resetPassword(ResetPasswordRequest request) {

		Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

		if (optionalUser.isEmpty()) {
			throw new IllegalArgumentException("No account was found for this email address.");
		}

		User user = optionalUser.get();

		if (!Boolean.TRUE.equals(user.getOtpVerified())) {
			throw new IllegalArgumentException("OTP is not verified.");
		}

		if (!request.getNewPassword().equals(request.getConfirmPassword())) {
			throw new IllegalArgumentException("Password and Confirm Password do not match.");
		}

		user.setPassword(passwordEncoder.encode(request.getNewPassword()));

		user.setOtp(null);
		user.setOtpExpiry(null);
		user.setOtpVerified(false);
		user.setUpdatedAt(LocalDateTime.now());

		userRepository.save(user);

		return "Password Reset Successfully";
	}

	// ================= OTP =================

	private String generateOtp() {

		int otp = (int) (Math.random() * 900000) + 100000;

		return String.valueOf(otp);
	}
}
