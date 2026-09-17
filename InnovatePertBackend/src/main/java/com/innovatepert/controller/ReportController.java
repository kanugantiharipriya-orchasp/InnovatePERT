package com.innovatepert.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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
    public ResponseEntity<byte[]> downloadProjectManagersPdf(Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] pdfBytes = reportService.exportProjectManagersPdfByUserId(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "project_managers_report.pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/project-managers/download/xlsx")
    public ResponseEntity<byte[]> downloadProjectManagersExcel(Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] excelBytes = reportService.exportProjectManagersExcelByUserId(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "project_managers_report.xlsx");

            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/complete-project/download/pdf")
    public ResponseEntity<byte[]> downloadCompleteProjectPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] pdfBytes = reportService.exportCompleteProjectPdfByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "complete_project_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/complete-project/download/xlsx")
    public ResponseEntity<byte[]> downloadCompleteProjectExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] excelBytes = reportService.exportCompleteProjectExcelByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "complete_project_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
   

    @GetMapping("/risk-assessment/download/pdf")
    public ResponseEntity<byte[]> downloadRiskAssessmentPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] pdfBytes = reportService.exportRiskAssessmentPdfByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "risk_assessment_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/risk-assessment/download/xlsx")
    public ResponseEntity<byte[]> downloadRiskAssessmentExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] excelBytes = reportService.exportRiskAssessmentExcelByUserId(projectId, userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "risk_assessment_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }



    @GetMapping("/project-crashing/download/pdf")
    public ResponseEntity<byte[]> downloadProjectCrashingPdf(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] pdfBytes = reportService.exportProjectCrashingPdfByUserId(projectId, userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "project_crashing_report_proj_" + projectId + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/project-crashing/download/xlsx")
    public ResponseEntity<byte[]> downloadProjectCrashingExcel(
            @RequestParam Integer projectId,
            Authentication authentication) {
        try {
            Integer userId = getLoggedInUserId(authentication);
            byte[] excelBytes = reportService.exportProjectCrashingExcelByUserId(projectId, userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "project_crashing_report_proj_" + projectId + ".xlsx");
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}