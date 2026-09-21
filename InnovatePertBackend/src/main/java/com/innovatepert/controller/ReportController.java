package com.innovatepert.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.innovatepert.dto.CompleteProjectReportDTO;
import com.innovatepert.dto.PortfolioRiskReportDTO;
import com.innovatepert.dto.ProjectManagerReportDTO;
import com.innovatepert.dto.RiskAssessmentReportDTO;
import com.innovatepert.entity.User;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.service.impl.ReportService;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserRepository userRepository;

    // Helper method to retrieve the authenticated user's ID from the email/username in JWT
    private Integer getLoggedInUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String emailOrUsername = authentication.getName();
            User user = userRepository.findByEmail(emailOrUsername)
                    .orElseGet(() -> userRepository.findAll().stream()
                            .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(emailOrUsername))
                            .findFirst()
                            .orElse(null));
            if (user != null) {
                return user.getUserId();
            }
        }
        return null;
    }

    // ==========================================
    // 1. PROJECT MANAGERS OVERVIEW REPORT
    // ==========================================

    @GetMapping("/project-managers/preview")
    public ResponseEntity<List<ProjectManagerReportDTO>> getProjectManagersPreview(Authentication authentication) {
        Integer userId = getLoggedInUserId(authentication);
        return ResponseEntity.ok(reportService.getProjectManagersReportDataByUserId(userId));
    }

    @GetMapping("/project-managers/download/pdf")
    public ResponseEntity<Resource> downloadProjectManagersPdf(Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource pdfBytes = reportService.exportProjectManagersPdfByUserId(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "project_managers_report.pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Project Managers PDF report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/project-managers/download/xlsx")
    public ResponseEntity<Resource> downloadProjectManagersExcel(Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource excelBytes = reportService.exportProjectManagersExcelByUserId(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "project_managers_report.xlsx");

            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Project Managers Excel report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/complete-project/download/pdf")
    public ResponseEntity<Resource> downloadCompleteProjectPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource pdfBytes = reportService.exportCompleteProjectPdfByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "complete_project_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Complete Project PDF report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/complete-project/download/xlsx")
    public ResponseEntity<Resource> downloadCompleteProjectExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource excelBytes = reportService.exportCompleteProjectExcelByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "complete_project_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Complete Project Excel report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
   

    @GetMapping("/risk-assessment/download/pdf")
    public ResponseEntity<Resource> downloadRiskAssessmentPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource pdfBytes = reportService.exportRiskAssessmentPdfByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "risk_assessment_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Risk Assessment PDF report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/risk-assessment/download/xlsx")
    public ResponseEntity<Resource> downloadRiskAssessmentExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource excelBytes = reportService.exportRiskAssessmentExcelByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "risk_assessment_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Risk Assessment Excel report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }



    @GetMapping("/project-crashing/download/pdf")
    public ResponseEntity<Resource> downloadProjectCrashingPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource pdfBytes = reportService.exportProjectCrashingPdfByUserId(projectId, userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "project_crashing_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Project Crashing PDF report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/project-crashing/download/xlsx")
    public ResponseEntity<Resource> downloadProjectCrashingExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            Resource excelBytes = reportService.exportProjectCrashingExcelByUserId(projectId, userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "project_crashing_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Project Crashing Excel report for projectId: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}