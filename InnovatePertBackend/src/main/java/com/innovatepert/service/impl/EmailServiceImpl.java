package com.innovatepert.service.impl;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.innovatepert.service.EmailService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

	// Spring Boot automatically provides this bean because we added the
	// spring-boot-starter-mail dependency
	private final JavaMailSender mailSender;

	@Value("${spring.mail.username}")
	private String senderEmail;

	@Override
    @Async
	public void sendProjectManagerCredentials(String toEmail, String fullName, String temporaryPassword) {
		SimpleMailMessage message = new SimpleMailMessage();

		message.setFrom(senderEmail);
		message.setTo(toEmail);
		message.setSubject("Welcome to InnovatePERT - Login Credentials");
		message.setText("Hello " + fullName + ",\n\n"
				+ "You have been added as a Project Manager in the InnovatePERT system.\n\n"
				+ "Here are your login credentials:\n" + "Email: " + toEmail + "\n" + "Temporary Password: "
				+ temporaryPassword + "\n\n" + "Login URL: http://localhost:3000/login\n\n"
				+ "Please log in and change your password immediately.\n\n"
				+ "Best Regards,\nInnovatePERT R&D Director");

		try {
			mailSender.send(message);
			log.info("Successfully sent Project Manager credentials to {}", toEmail);
		} catch (Exception e) {
			log.error("Failed to send Project Manager credentials to {}. Error: {}", toEmail, e.getMessage(), e);
		}
	}

	@Override
    @Async
    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);

        message.setSubject("InnovatePERT - Password Reset OTP");

        message.setText(
                "Hello,\n\n"
              + "Your OTP for resetting your InnovatePERT password is: "
              + otp
              + "\n\n"
              + "This OTP is valid for 10 minutes."
              + "\n\n"
              + "If you did not request a password reset, please ignore this email."
              + "\n\n"
              + "Regards,\n"
              + "InnovatePERT Team");

        try {
            mailSender.send(message);
            log.info("Successfully sent OTP email to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }
	
	@Override
    @Async
    public void sendProjectAssignmentNotification(String toEmail, String managerName, String projectName, String description, String priority, String startDate, String targetDate, String budget) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("New Project Assigned: " + projectName);
        message.setText("Hello " + managerName + ",\n\n"
                + "A new project has been assigned to you by the R&D Director.\n\n"
                + "--- Project Details ---\n"
                + "Project Name : " + projectName + "\n"
                + "Description  : " + description + "\n"
                + "Priority     : " + priority + "\n"
                + "Start Date   : " + startDate + "\n"
                + "Target Date  : " + targetDate + "\n"
                + "Budget       : " + budget + "\n"
                + "Current Status: NOT_STARTED\n\n"
                + "--- Next Steps ---\n"
                + "1. Log in to the InnovatePERT system: http://localhost:3000/login\n"
                + "2. Navigate to 'My Assigned Projects'.\n"
                + "3. Review the project specifications.\n"
                + "4. Advance the project status sequentially (NOT_STARTED -> IN_PROGRESS -> COMPLETED) as your work progresses.\n\n"
                + "Best Regards,\nInnovatePERT R&D Director");

        try {
            mailSender.send(message);
            log.info("Successfully sent project assignment notification to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send project assignment notification to {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }
    
    @Override
    @Async
    public void sendProjectUpdateNotification(String toEmail, String managerName, String projectName, String updatedFields) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Project Updated: " + projectName);
        message.setText("Hello " + managerName + ",\n\n"
                + "The R&D Director has updated the details for your assigned project: " + projectName + ".\n\n"
                + "The following changes were made:\n\n"
                + updatedFields + "\n"
                + "Please log in to the InnovatePERT system to review the changes.\n\n"
                + "Best Regards,\nInnovatePERT R&D Director");

        try {
            mailSender.send(message);
            log.info("Successfully sent project update notification to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send project update notification to {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendProjectManagerProfileUpdateNotification(String toEmail, String managerName, String changedFields) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Profile Update Notification");
        message.setText("Hello " + managerName + ",\n\n"
                + "Your profile details have been updated by the R&D Director.\n\n"
                + "The following changes were made:\n\n"
                + changedFields + "\n"
                + "If you did not expect these changes, please contact your R&D Director immediately.\n\n"
                + "Best Regards,\nInnovatePERT System Administrator");

        try {
            mailSender.send(message);
            log.info("Successfully sent profile update notification to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send profile update notification to {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendProjectTransferNotificationToOldPM(String toEmail, String managerName, String projectName, String newManagerName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Project Transfer Notification: " + projectName);
        message.setText("Hello " + managerName + ",\n\n"
                + "The project '" + projectName + "' has been successfully transferred from you to another Project Manager (" + newManagerName + ").\n\n"
                + "You no longer have access to this project or its activities. Your access to all other assigned projects remains unchanged.\n\n"
                + "Best Regards,\nInnovatePERT R&D Director");
        try {
            mailSender.send(message);
            log.info("Successfully sent project transfer notification to old PM {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send project transfer notification to old PM {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendProjectTransferNotificationToNewPM(String toEmail, String managerName, String projectName, String oldManagerName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Project Transfer Assigned: " + projectName);
        message.setText("Hello " + managerName + ",\n\n"
                + "The project '" + projectName + "' has been transferred to you from " + oldManagerName + ".\n\n"
                + "You now have full access to this complete project and all of its existing activities. You can continue working on it according to your existing permissions.\n\n"
                + "Please log in to the InnovatePERT system to review the project.\n\n"
                + "Best Regards,\nInnovatePERT R&D Director");
        try {
            mailSender.send(message);
            log.info("Successfully sent project transfer notification to new PM {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send project transfer notification to new PM {}. Error: {}", toEmail, e.getMessage(), e);
        }
    }
}
