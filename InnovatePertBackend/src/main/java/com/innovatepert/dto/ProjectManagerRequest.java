package com.innovatepert.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectManagerRequest {

    @NotBlank(message = "Full Name is required")
    @Size(min = 2, max = 50, message = "Full Name should be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z]+( [a-zA-Z]+)*$", message = "Name can contain letters and single spaces only.")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a well-formed email address")
    @Pattern(regexp = "^(?!\\d+@)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Please enter a valid email address. Numeric-only usernames and spaces are not allowed.")
    private String email;
}
