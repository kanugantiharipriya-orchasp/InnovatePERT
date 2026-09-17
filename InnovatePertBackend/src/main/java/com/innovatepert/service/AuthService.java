package com.innovatepert.service;

import com.innovatepert.dto.ForgotPasswordRequest;
import com.innovatepert.dto.LoginRequest;
import com.innovatepert.dto.LoginResponse;
import com.innovatepert.dto.RegisterRequest;
import com.innovatepert.dto.RegisterResponse;
import com.innovatepert.dto.ResetPasswordRequest;
import com.innovatepert.dto.VerifyOtpRequest;

public interface AuthService {

    RegisterResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    String forgotPassword(ForgotPasswordRequest request);

     String verifyOtp(VerifyOtpRequest request);
  
    String resetPassword(ResetPasswordRequest request);

}