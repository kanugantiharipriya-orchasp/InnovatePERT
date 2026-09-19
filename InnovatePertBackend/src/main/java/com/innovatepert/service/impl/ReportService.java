package com.innovatepert.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovatepert.dto.ActivityReportDTO;
import com.innovatepert.dto.CompleteProjectReportDTO;
import com.innovatepert.dto.PortfolioRiskReportDTO;
import com.innovatepert.dto.ProjectManagerReportDTO;
import com.innovatepert.dto.RiskAssessmentReportDTO;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.PertResult;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.Report;
import com.innovatepert.entity.User;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.enums.ProjectStatus;
import com.innovatepert.enums.ReportStatus;
import com.innovatepert.enums.ReportType;
import com.innovatepert.enums.Role;
import com.innovatepert.repository.ActivityRepository;
import com.innovatepert.repository.PertResultRepository;
import com.innovatepert.repository.ProjectRepository;
import com.innovatepert.repository.ReportRepository;
import com.innovatepert.repository.UserRepository;
import com.innovatepert.util.ProbabilityUtil;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleXlsxReportConfiguration;

@Service
public class ReportService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private PertResultRepository pertResultRepository;

    @Autowired
    private ReportRepository reportAuditRepository;

    @Autowired
    private com.innovatepert.repository.ProjectCrashingRepository projectCrashingRepository;

    // Helper to fetch and validate the logged-in user entity
    private User getLoggedInUserEntity(Integer userId) {
        if (userId != null) {
            return userRepository.findById(userId).orElse(null);
        }
        return userRepository.findAll().stream().findFirst().orElse(null);
    }

    // Helper to validate that a project falls under user management scope
    private void validateProjectAccess(Project project, User user) {
        if (user == null) {
            throw new RuntimeException("Unauthorized: User is null.");
        }

        if (user.getRole() == Role.ADMIN) {
            boolean isAssignedBy = project.getAssignedBy() != null && project.getAssignedBy().getUserId().equals(user.getUserId());
            boolean isManagerCreatedByThisAdmin = project.getAssignedTo() != null &&
                    project.getAssignedTo().getCreatedByAdmin() != null &&
                    project.getAssignedTo().getCreatedByAdmin().getUserId().equals(user.getUserId());

            if (!isAssignedBy && !isManagerCreatedByThisAdmin) {
                throw new RuntimeException("Unauthorized: This project does not belong to your organization scope.");
            }
        } else if (user.getRole() == Role.PROJECT_MANAGER) {
            boolean isAssigned = project.getAssignedTo() != null &&
                                 project.getAssignedTo().getUserId().equals(user.getUserId());
            if (!isAssigned) {
                throw new RuntimeException("Unauthorized: Project Manager cannot access unassigned project ID " + project.getProjectId());
            }
        }
    }

    private void saveReportAudit(User user, ReportType reportType, String format, ReportStatus status) {
        if (user != null) {
            Report report = Report.builder()
                    .project(null)
                    .generatedBy(user)
                    .reportType(reportType)
                    .fileFormat(format)
                    .status(status)
                    .build();
            reportAuditRepository.save(report);
        }
    }

    private void saveReportAuditWithProject(User user, Project project, ReportType type, String format, ReportStatus status) {
        if (user != null) {
            Report report = Report.builder()
                    .project(project)
                    .generatedBy(user)
                    .reportType(type)
                    .fileFormat(format)
                    .status(status)
                    .build();
            reportAuditRepository.save(report);
        }
    }

    // Shared helper: compiles a jrxml from classpath resource, fills it, and exports to PDF
    private byte[] generatePdfFromStream(String jrxmlClasspath, Map<String, Object> parameters, List<?> data) {
        try (InputStream jrxmlStream = getClass().getResourceAsStream("/" + jrxmlClasspath)) {
            if (jrxmlStream == null) {
                throw new RuntimeException("Jasper template not found in classpath: /" + jrxmlClasspath);
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxmlStream);

            JRBeanCollectionDataSource dataSource = (data != null && !data.isEmpty()) 
                    ? new JRBeanCollectionDataSource(data) 
                    : new JRBeanCollectionDataSource(List.of());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generating Jasper PDF report: " + e.getMessage(), e);
        }
    }

    // Shared helper: compiles a jrxml from classpath resource, fills it, and exports to XLSX
    private byte[] generateExcelFromStream(String jrxmlClasspath, Map<String, Object> parameters, List<?> data, String sheetName) {
        try (InputStream jrxmlStream = getClass().getResourceAsStream("/" + jrxmlClasspath)) {
            if (jrxmlStream == null) {
                throw new RuntimeException("Jasper template not found in classpath: /" + jrxmlClasspath);
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxmlStream);

            JRBeanCollectionDataSource dataSource = (data != null && !data.isEmpty()) 
                    ? new JRBeanCollectionDataSource(data) 
                    : new JRBeanCollectionDataSource(List.of());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            JRXlsxExporter exporter = new JRXlsxExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(byteArrayOutputStream));

            SimpleXlsxReportConfiguration reportConfig = new SimpleXlsxReportConfiguration();
            reportConfig.setSheetNames(new String[]{sheetName});
            reportConfig.setRemoveEmptySpaceBetweenRows(true);
            exporter.setConfiguration(reportConfig);

            exporter.exportReport();
            return byteArrayOutputStream.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generating Jasper Excel report: " + e.getMessage(), e);
        }
    }

    // ==========================================
    // 1. PROJECT MANAGERS OVERVIEW REPORT
    // ==========================================

    private List<ProjectManagerReportDTO> fetchProjectManagersReportData(User user) {
        List<User> managers;
        if (user != null && user.getRole() == Role.ADMIN) {
            managers = userRepository.findByRoleAndCreatedByAdmin(Role.PROJECT_MANAGER, user);
        } else if (user != null && user.getRole() == Role.PROJECT_MANAGER) {
            managers = List.of(user);
        } else {
            managers = List.of();
        }

        return managers.stream().map(manager -> {
            long actualProjectCount = projectRepository.countByAssignedTo(manager);
            return ProjectManagerReportDTO.builder()
                .managerId(manager.getUserId())
                .fullName(manager.getFullName())
                .email(manager.getEmail())
                .status(manager.getStatus() != null ? manager.getStatus().name() : "INACTIVE")
                .projectCount((int) actualProjectCount)
                .build();
        }).collect(Collectors.toList());
    }

    public List<ProjectManagerReportDTO> getProjectManagersReportDataByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<ProjectManagerReportDTO> dtos = fetchProjectManagersReportData(user);
        saveReportAudit(user, ReportType.PROJECT_MANAGERS, "JSON", ReportStatus.GENERATED);
        return dtos;
    }

    public byte[] exportProjectManagersPdfByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<ProjectManagerReportDTO> data = fetchProjectManagersReportData(user);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Managers Overview Report");
        byte[] pdf = generatePdfFromStream("reports/project_managers_report.jrxml", parameters, data);
        saveReportAudit(user, ReportType.PROJECT_MANAGERS, "PDF", ReportStatus.DOWNLOADED);
        return pdf;
    }

    public byte[] exportProjectManagersExcelByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<ProjectManagerReportDTO> data = fetchProjectManagersReportData(user);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Managers Overview Report");
        byte[] excel = generateExcelFromStream("reports/project_managers_report.jrxml", parameters, data, "Project Managers Report");
        saveReportAudit(user, ReportType.PROJECT_MANAGERS, "XLSX", ReportStatus.DOWNLOADED);
        return excel;
    }

    // ==========================================
    // 2. DYNAMIC COMPLETE PROJECT REPORT
    // ==========================================

    private CompleteProjectReportDTO fetchCompleteProjectReportData(Integer projectId, User requestingUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        validateProjectAccess(project, requestingUser);

        List<Activity> activities = activityRepository.findByProject_ProjectId(projectId);
        List<PertResult> pertResults = pertResultRepository.findByProject_ProjectId(projectId);

        int totalTasks = activities.size();
        
        long completedTasksCount = activities.stream()
                .filter(a -> a.getStatus() == ActivityStatus.COMPLETED)
                .count();

        double completionPercentage = totalTasks > 0 
                ? ((double) completedTasksCount / totalTasks) * 100.0 
                : 0.0;

        double totalExpectedDuration = pertResults.stream()
                .mapToDouble(p -> p.getExpectedTime() != null ? p.getExpectedTime() : 0.0)
                .sum();

        double totalVariance = pertResults.stream()
                .mapToDouble(p -> p.getVariance() != null ? p.getVariance() : 0.0)
                .sum();
        
        double projectStandardDeviation = Math.sqrt(totalVariance);

        String managerName = (project.getAssignedTo() != null) ? project.getAssignedTo().getFullName() : "Unassigned";

        List<ActivityReportDTO> activityDTOs = activities.stream().map(a -> ActivityReportDTO.builder()
                .activityId(a.getActivityId())
                .activityName(a.getActivityName())
//                .description(a.getDescription())
                .optimisticTime(a.getOptimisticTime())
                .mostLikelyTime(a.getMostLikelyTime())
                .pessimisticTime(a.getPessimisticTime())
                .expectedTime(a.getExpectedTime())
                .normalCost(a.getNormalCost())
                .status(a.getStatus() != null ? a.getStatus().name() : "PENDING")
                .build()
        ).collect(Collectors.toList());

        return CompleteProjectReportDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .projectDescription(project.getDescription())
                .startDate(project.getStartDate())
                .targetDate(project.getTargetDate())
                .priority(project.getPriority() != null ? project.getPriority().name() : "NORMAL")
                .status(project.getStatus() != null ? project.getStatus().name() : "IN_PROGRESS")
                .budget(project.getBudget() != null ? project.getBudget() : BigDecimal.ZERO)
                .managerName(managerName)
                .totalTasks(totalTasks)
                .completedTasksCount((int) completedTasksCount)
                .completionPercentage(Math.round(completionPercentage * 100.0) / 100.0)
                .totalExpectedDuration(Math.round(totalExpectedDuration * 100.0) / 100.0)
                .projectStandardDeviation(Math.round(projectStandardDeviation * 100.0) / 100.0)
                .activities(activityDTOs)
                .build();
    }

    public CompleteProjectReportDTO getCompleteProjectReportDataByUserId(Integer projectId, Integer userId) {
        User requestingUser = getLoggedInUserEntity(userId);
        CompleteProjectReportDTO dto = fetchCompleteProjectReportData(projectId, requestingUser);
        Project project = projectRepository.findById(projectId).orElse(null);
        saveReportAuditWithProject(requestingUser, project, ReportType.COMPLETE_PROJECT, "JSON", ReportStatus.GENERATED);
        return dto;
    }

    private JasperPrint fillCompleteProjectJasperReport(Integer projectId, User requestingUser) throws Exception {
        CompleteProjectReportDTO dto = fetchCompleteProjectReportData(projectId, requestingUser);

        try (InputStream jrxmlStream = getClass().getResourceAsStream("/reports/complete_project_report.jrxml")) {
            if (jrxmlStream == null) {
                throw new RuntimeException("Jasper template not found in classpath: /reports/complete_project_report.jrxml");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxmlStream);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("projectId", dto.getProjectId());
        parameters.put("projectName", dto.getProjectName());
        parameters.put("description", dto.getProjectDescription());
        parameters.put("status", dto.getStatus());
        parameters.put("priority", dto.getPriority());
        parameters.put("managerName", dto.getManagerName());
        parameters.put("startDate", dto.getStartDate() != null ? dto.getStartDate().toString() : "");
        parameters.put("targetDate", dto.getTargetDate() != null ? dto.getTargetDate().toString() : "");
        parameters.put("budget", dto.getBudget());
        parameters.put("totalTasks", dto.getTotalTasks());
        parameters.put("completedTasks", dto.getCompletedTasksCount());
        parameters.put("completionPercentage", dto.getCompletionPercentage());
        parameters.put("totalExpectedDuration", dto.getTotalExpectedDuration());
        parameters.put("totalVariance", dto.getProjectStandardDeviation() != null ? Math.pow(dto.getProjectStandardDeviation(), 2) : 0.0);
        parameters.put("projectStandardDeviation", dto.getProjectStandardDeviation());
        parameters.put("showActivityDetails", dto.getActivities() != null);

        JRBeanCollectionDataSource dataSource = (dto.getActivities() != null && !dto.getActivities().isEmpty())
                ? new JRBeanCollectionDataSource(dto.getActivities())
                : new JRBeanCollectionDataSource(List.of());

            return JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        }
    }

    public byte[] exportCompleteProjectPdfByUserId(Integer projectId, Integer userId) throws Exception {
        User requestingUser = getLoggedInUserEntity(userId);
        JasperPrint jasperPrint = fillCompleteProjectJasperReport(projectId, requestingUser);
        byte[] pdfBytes = JasperExportManager.exportReportToPdf(jasperPrint);

        Project project = projectRepository.findById(projectId).orElse(null);
        saveReportAuditWithProject(requestingUser, project, ReportType.COMPLETE_PROJECT, "PDF", ReportStatus.DOWNLOADED);

        return pdfBytes;
    }

    public byte[] exportCompleteProjectExcelByUserId(Integer projectId, Integer userId) throws Exception {
        User requestingUser = getLoggedInUserEntity(userId);
        JasperPrint jasperPrint = fillCompleteProjectJasperReport(projectId, requestingUser);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JRXlsxExporter exporter = new JRXlsxExporter();

        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
        exporter.exportReport();

        byte[] excelBytes = outputStream.toByteArray();

        Project project = projectRepository.findById(projectId).orElse(null);
        saveReportAuditWithProject(requestingUser, project, ReportType.COMPLETE_PROJECT, "XLSX", ReportStatus.DOWNLOADED);

        return excelBytes;
    }

    // ==========================================
    // 3. RISK ASSESSMENT REPORT (single project)
    // ==========================================

    private RiskAssessmentReportDTO fetchRiskAssessmentReportData(Integer projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        validateProjectAccess(project, user);

        List<PertResult> pertResults = pertResultRepository.findByProject_ProjectId(project.getProjectId());

        double expectedDuration = pertResults.stream().mapToDouble(p -> p.getExpectedTime() != null ? p.getExpectedTime() : 0.0).sum();
        double variance = pertResults.stream().mapToDouble(p -> p.getVariance() != null ? p.getVariance() : 0.0).sum();
        double standardDeviation = Math.sqrt(variance);

        long businessDays = (project.getStartDate() != null && project.getTargetDate() != null)
                ? ChronoUnit.DAYS.between(project.getStartDate(), project.getTargetDate())
                : 0;

        double zScore = standardDeviation == 0 ? 0 : (businessDays - expectedDuration) / standardDeviation;
        double probability = ProbabilityUtil.cumulativeProbability(zScore);
        String riskLevel = probability >= 80 ? "LOW" : (probability >= 50 ? "MEDIUM" : "HIGH");
        String managerName = (project.getAssignedTo() != null) ? project.getAssignedTo().getFullName() : "Unassigned";

        return RiskAssessmentReportDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .projectDescription(project.getDescription())
                .status(project.getStatus() != null ? project.getStatus().name() : "IN_PROGRESS")
                .priority(project.getPriority() != null ? project.getPriority().name() : "NORMAL")
                .managerName(managerName)
                .startDate(project.getStartDate())
                .targetDate(project.getTargetDate())
                .budget(project.getBudget() != null ? project.getBudget() : BigDecimal.ZERO)
                .businessTargetDuration(BigDecimal.valueOf(businessDays).setScale(2, RoundingMode.HALF_UP))
                .expectedDuration(BigDecimal.valueOf(expectedDuration).setScale(2, RoundingMode.HALF_UP))
                .variance(BigDecimal.valueOf(variance).setScale(2, RoundingMode.HALF_UP))
                .standardDeviation(BigDecimal.valueOf(standardDeviation).setScale(2, RoundingMode.HALF_UP))
                .zScore(BigDecimal.valueOf(zScore).setScale(4, RoundingMode.HALF_UP))
                .completionProbability(BigDecimal.valueOf(probability).setScale(2, RoundingMode.HALF_UP))
                .riskLevel(riskLevel)
                .build();
    }

    public RiskAssessmentReportDTO getRiskAssessmentReportDataByUserId(Integer projectId, Integer userId) {
        User user = getLoggedInUserEntity(userId);
        RiskAssessmentReportDTO dto = fetchRiskAssessmentReportData(projectId, user);
        Project project = projectRepository.findById(projectId).orElse(null);
        saveReportAuditWithProject(user, project, ReportType.RISK_ASSESSMENT, "JSON", ReportStatus.GENERATED);
        return dto;
    }

    public byte[] exportRiskAssessmentPdfByUserId(Integer projectId, Integer userId) {
        User user = getLoggedInUserEntity(userId);
        RiskAssessmentReportDTO data = fetchRiskAssessmentReportData(projectId, user);

        PortfolioRiskReportDTO pDto = PortfolioRiskReportDTO.builder()
                .projectId(data.getProjectId())
                .projectName(data.getProjectName())
                .status(data.getStatus())
                .priority(data.getPriority())
                .managerName(data.getManagerName())
                .targetDate(data.getTargetDate())
                .expectedDuration(data.getExpectedDuration())
                .completionProbability(data.getCompletionProbability())
                .riskLevel(data.getRiskLevel())
                .build();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Risk Assessment Report - " + data.getProjectName());
        byte[] pdf = generatePdfFromStream("reports/portfolio_risk_report.jrxml", parameters, List.of(pDto));
        saveReportAudit(user, ReportType.RISK_ASSESSMENT, "PDF", ReportStatus.DOWNLOADED);
        return pdf;
    }

    public byte[] exportRiskAssessmentExcelByUserId(Integer projectId, Integer userId) {
        User user = getLoggedInUserEntity(userId);
        RiskAssessmentReportDTO data = fetchRiskAssessmentReportData(projectId, user);

        PortfolioRiskReportDTO pDto = PortfolioRiskReportDTO.builder()
                .projectId(data.getProjectId())
                .projectName(data.getProjectName())
                .status(data.getStatus())
                .priority(data.getPriority())
                .managerName(data.getManagerName())
                .targetDate(data.getTargetDate())
                .expectedDuration(data.getExpectedDuration())
                .completionProbability(data.getCompletionProbability())
                .riskLevel(data.getRiskLevel())
                .build();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Risk Assessment Report - " + data.getProjectName());
        byte[] excel = generateExcelFromStream("reports/portfolio_risk_report.jrxml", parameters, List.of(pDto), "Risk Assessment Report");
        saveReportAudit(getLoggedInUserEntity(userId), ReportType.RISK_ASSESSMENT, "XLSX", ReportStatus.DOWNLOADED);
        return excel;
    }

    // ==========================================
    // 4. ADMIN PORTFOLIO-WIDE RISK REPORT
    // ==========================================

    private List<PortfolioRiskReportDTO> fetchPortfolioRiskReportData(User user) {
        if (user != null && user.getRole() == Role.PROJECT_MANAGER) {
            throw new RuntimeException("Unauthorized: Project Managers cannot access portfolio-wide aggregate reports.");
        }

        List<Project> targetProjects = (user != null && user.getRole() == Role.ADMIN)
                ? projectRepository.findProjectsByAdmin(user)
                : (user != null ? projectRepository.findByAssignedTo(user) : List.of());

        return targetProjects.stream().map(project -> {
            List<PertResult> pertResults = pertResultRepository.findByProject_ProjectId(project.getProjectId());

            double expectedDuration = pertResults.stream().mapToDouble(p -> p.getExpectedTime() != null ? p.getExpectedTime() : 0.0).sum();
            double variance = pertResults.stream().mapToDouble(p -> p.getVariance() != null ? p.getVariance() : 0.0).sum();
            double standardDeviation = Math.sqrt(variance);

            long businessDays = (project.getStartDate() != null && project.getTargetDate() != null)
                    ? ChronoUnit.DAYS.between(project.getStartDate(), project.getTargetDate())
                    : 0;

            double zScore = standardDeviation == 0 ? 0 : (businessDays - expectedDuration) / standardDeviation;
            double probability = ProbabilityUtil.cumulativeProbability(zScore);
            String riskLevel = probability >= 80 ? "LOW" : (probability >= 50 ? "MEDIUM" : "HIGH");
            String managerName = (project.getAssignedTo() != null) ? project.getAssignedTo().getFullName() : "Unassigned";

            return PortfolioRiskReportDTO.builder()
                    .projectId(project.getProjectId())
                    .projectName(project.getProjectName())
                    .status(project.getStatus() != null ? project.getStatus().name() : "IN_PROGRESS")
                    .priority(project.getPriority() != null ? project.getPriority().name() : "NORMAL")
                    .managerName(managerName)
                    .targetDate(project.getTargetDate())
                    .expectedDuration(BigDecimal.valueOf(expectedDuration).setScale(2, RoundingMode.HALF_UP))
                    .completionProbability(BigDecimal.valueOf(probability).setScale(2, RoundingMode.HALF_UP))
                    .riskLevel(riskLevel)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<PortfolioRiskReportDTO> getPortfolioRiskReportDataByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<PortfolioRiskReportDTO> portfolioList = fetchPortfolioRiskReportData(user);
        saveReportAudit(user, ReportType.RISK_ASSESSMENT, "JSON", ReportStatus.GENERATED);
        return portfolioList;
    }

    public byte[] exportPortfolioRiskPdfByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<PortfolioRiskReportDTO> data = fetchPortfolioRiskReportData(user);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Portfolio-Wide Risk Assessment Report");
        byte[] pdf = generatePdfFromStream("reports/portfolio_risk_report.jrxml", parameters, data);
        saveReportAudit(user, ReportType.RISK_ASSESSMENT, "PDF", ReportStatus.DOWNLOADED);
        return pdf;
    }

    public byte[] exportPortfolioRiskExcelByUserId(Integer userId) {
        User user = getLoggedInUserEntity(userId);
        List<PortfolioRiskReportDTO> data = fetchPortfolioRiskReportData(user);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Portfolio-Wide Risk Assessment Report");
        byte[] excel = generateExcelFromStream("reports/portfolio_risk_report.jrxml", parameters, data, "Portfolio Risk Report");
        saveReportAudit(getLoggedInUserEntity(userId), ReportType.RISK_ASSESSMENT, "XLSX", ReportStatus.DOWNLOADED);
        return excel;
    }

    // ==========================================
    // 5. PROJECT CRASHING REPORT
    // ==========================================

    private com.innovatepert.dto.ProjectCrashingReportDTO fetchProjectCrashingReportData(Integer projectId, User requestingUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        validateProjectAccess(project, requestingUser);

        List<com.innovatepert.entity.ProjectCrashing> crashingRows = projectCrashingRepository.findByProject_ProjectId(projectId);

        if (crashingRows.isEmpty()) {
            return com.innovatepert.dto.ProjectCrashingReportDTO.builder()
                    .projectId(project.getProjectId())
                    .projectName(project.getProjectName())
                    .analysisDate("N/A")
                    .currentDuration(0.0)
                    .targetDuration(0.0)
                    .requiredReduction(0.0)
                    .totalTimeSaved(0.0)
                    .totalAdditionalCost(0.0)
                    .recommendedActivitiesCount(0)
                    .activities(List.of())
                    .build();
        }

        Long maxCrashingId = crashingRows.stream()
                .mapToLong(com.innovatepert.entity.ProjectCrashing::getCrashingId)
                .max()
                .orElse(0L);

        List<com.innovatepert.entity.ProjectCrashing> latestRows = crashingRows.stream()
                .filter(r -> r.getCrashingId().equals(maxCrashingId))
                .collect(Collectors.toList());

        com.innovatepert.entity.ProjectCrashing sample = latestRows.get(0);
        String dateStr = sample.getCreatedAt() != null
                ? sample.getCreatedAt().toString().replace("T", " ").substring(0, 16)
                : "Recent";

        List<com.innovatepert.dto.ProjectCrashingItemDTO> itemDtos = latestRows.stream()
                .map(r -> com.innovatepert.dto.ProjectCrashingItemDTO.builder()
                        .priority(r.getPriority())
                        .activityName(r.getActivityName())
                        .normalTime(r.getNormalTime())
                        .crashTime(r.getCrashTime())
                        .timeSaved(r.getTimeSaved())
                        .normalCost(r.getNormalCost())
                        .crashCost(r.getCrashCost())
                        .additionalCost(r.getAdditionalCost())
                        .costSlope(r.getCostSlope())
                        .recommendation(r.getRecommendation())
                        .build())
                .collect(Collectors.toList());

        long recommendedCount = latestRows.stream().filter(r -> Boolean.TRUE.equals(r.getRecommended())).count();

        return com.innovatepert.dto.ProjectCrashingReportDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .analysisDate(dateStr)
                .currentDuration(sample.getCurrentDuration())
                .targetDuration(sample.getTargetDuration())
                .requiredReduction(sample.getCurrentDuration() != null && sample.getTargetDuration() != null 
                        ? Math.max(0.0, sample.getCurrentDuration() - sample.getTargetDuration()) : 0.0)
                .totalTimeSaved(sample.getTotalTimeSaved())
                .totalAdditionalCost(sample.getTotalAdditionalCost())
                .recommendedActivitiesCount((int) recommendedCount)
                .activities(itemDtos)
                .build();
    }

    public com.innovatepert.dto.ProjectCrashingReportDTO getProjectCrashingReportDataByUserId(Integer projectId, Integer userId) {
        User requestingUser = getLoggedInUserEntity(userId);
        com.innovatepert.dto.ProjectCrashingReportDTO dto = fetchProjectCrashingReportData(projectId, requestingUser);
        saveReportAudit(requestingUser, ReportType.PROJECT_CRASHING, "JSON", ReportStatus.GENERATED);
        return dto;
    }

    public byte[] exportProjectCrashingPdfByUserId(Integer projectId, Integer userId) {
        User requestingUser = getLoggedInUserEntity(userId);
        com.innovatepert.dto.ProjectCrashingReportDTO data = fetchProjectCrashingReportData(projectId, requestingUser);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Crashing Report - " + data.getProjectName());
        byte[] pdf = generatePdfFromStream("reports/project_crashing_report.jrxml", parameters, data.getActivities());
        saveReportAudit(requestingUser, ReportType.PROJECT_CRASHING, "PDF", ReportStatus.DOWNLOADED);
        return pdf;
    }

    public byte[] exportProjectCrashingExcelByUserId(Integer projectId, Integer userId) {
        User requestingUser = getLoggedInUserEntity(userId);
        com.innovatepert.dto.ProjectCrashingReportDTO data = fetchProjectCrashingReportData(projectId, requestingUser);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Crashing Report - " + data.getProjectName());
        byte[] excel = generateExcelFromStream("reports/project_crashing_report.jrxml", parameters, data.getActivities(), "Project Crashing Report");
        saveReportAudit(getLoggedInUserEntity(userId), ReportType.PROJECT_CRASHING, "XLSX", ReportStatus.DOWNLOADED);
        return excel;
    }
}