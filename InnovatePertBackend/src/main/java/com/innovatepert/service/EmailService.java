package com.innovatepert.service;

public interface EmailService {

    void sendProjectManagerCredentials(String toEmail, String fullName, String temporaryPassword);

    void sendOtpEmail(String toEmail, String otp);
    
    void sendProjectAssignmentNotification(
            String toEmail,
            String managerName,
            String projectName,
            String description,
            String priority,
            String startDate,
            String targetDate,
            String budget);
            
    void sendProjectUpdateNotification(String toEmail, String managerName, String projectName, String updatedFields);
    
    void sendProjectManagerProfileUpdateNotification(String toEmail, String managerName, String changedFields);
    
    void sendProjectTransferNotificationToOldPM(String toEmail, String managerName, String projectName, String newManagerName);
    
    void sendProjectTransferNotificationToNewPM(String toEmail, String managerName, String projectName, String oldManagerName);
}
