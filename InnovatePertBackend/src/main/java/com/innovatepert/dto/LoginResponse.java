package com.innovatepert.dto;

import com.innovatepert.enums.Role;


public class LoginResponse {

    private String message;
    private Integer userId;
    private String fullName;
    private String email;
    private Role role;
    private String token;

    // Default Constructor
    public LoginResponse() {
    }

    // Constructor for Error Messages
    public LoginResponse(String message) {
        this.message = message;
    }

    // Constructor for Successful Login
    public LoginResponse(String message,
            Integer userId,
            String fullName,
            String email,
            Role role,
            String token) {

this.message = message;
this.userId = userId;
this.fullName = fullName;
this.email = email;
this.role = role;
this.token = token;
}

    // Getters and Setters

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
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

  

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
    public Role getRole() {
        return role;
    }
    public void setRole(Role role) {
        this.role = role;
    }

}