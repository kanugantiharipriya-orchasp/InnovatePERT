package com.innovatepert.dto;

import com.innovatepert.enums.Role;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Full Name is required")
    @Size(min = 2, max = 50, message = "Full Name should be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z]+( [a-zA-Z]+)*$", message = "Name can contain letters and single spaces only.")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid Email Format")
    @Pattern(regexp = "^(?!\\d+@)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Please enter a valid email address. Numeric-only usernames and spaces are not allowed.")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 16, message = "Password must be between 8 and 16 characters")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!]).{8,16}$",
            message = "Password must be between 8 and 16 characters and contain uppercase, lowercase, number and special character"
    )
    private String password;

    @NotBlank(message = "Confirm Password is required")
    @Size(min = 8, max = 16, message = "Confirm Password must be between 8 and 16 characters")
    private String confirmPassword;

    private Role role;

    public RegisterRequest() {
    }

    // Getter and Setter for Full Name

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    // Getter and Setter for Email

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // Getter and Setter for Password

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Getter and Setter for Confirm Password

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    // Getter and Setter for Role
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}