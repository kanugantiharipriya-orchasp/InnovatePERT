package com.innovatepert.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public class AdminProfileRequest {

    @NotBlank(message="Full Name is Required")
    @Size(min=2,max=50, message = "Full Name should be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z]+( [a-zA-Z]+)*$", message = "Name can contain letters and single spaces only.")
    private String fullName;

    @NotBlank(message="Email is Required")
    @Email(message="Invalid Email")
    @Pattern(regexp = "^(?!\\d+@)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Please enter a valid email address. Numeric-only usernames and spaces are not allowed.")
    private String email;

    public AdminProfileRequest() {
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

}