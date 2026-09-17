package com.innovatepert.util;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

import com.innovatepert.dto.ProjectManagerRequest;
import com.innovatepert.exception.BadRequestException;

public class ExcelHelper {

    public static String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // 1. Validate that the uploaded file is strictly an Excel file
    public static boolean hasExcelFormat(MultipartFile file) {
        return EXCEL_TYPE.equals(file.getContentType()) || 
               file.getOriginalFilename().endsWith(".xlsx") || 
               file.getOriginalFilename().endsWith(".xls");
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");

    // 2. Parse the Excel file and extract real data row-by-row
    public static List<ProjectManagerRequest> parseExcelFile(InputStream is, Predicate<String> emailExistsInDb) {
        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0); // Grab the very first sheet
            List<ProjectManagerRequest> requests = new ArrayList<>();
            Set<String> seenEmailsInFile = new HashSet<>();

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Upload Failed: Invalid template structure. Please use the provided template.");
            }
            String col1 = getCellStringValue(headerRow.getCell(0)).trim();
            String col2 = getCellStringValue(headerRow.getCell(1)).trim();
            
            if (!"fullName".equals(col1) || !"email".equals(col2)) {
                throw new BadRequestException("Upload Failed: Invalid template structure. Please use the provided template.");
            }
            
            // Check if there are extra columns in the header
            if (headerRow.getLastCellNum() > 2) {
                // It's possible POI returns > 2 if there's formatting, but let's check if there is actual text in a 3rd column
                Cell col3 = headerRow.getCell(2);
                if (col3 != null && !getCellStringValue(col3).trim().isEmpty()) {
                    throw new BadRequestException("Upload Failed: Invalid template structure. Please use the provided template.");
                }
            }

            for (Row row : sheet) {
                int rowNum = row.getRowNum() + 1; // 1-based index for messages
                // Skip Header Row (Row 0)
                if (row.getRowNum() == 0) {
                    continue;
                }

                Cell nameCell = row.getCell(0);  // Column A: Full Name
                Cell emailCell = row.getCell(1); // Column B: Email Address

                String fullName = getCellStringValue(nameCell).trim();
                String email = getCellStringValue(emailCell).trim();

                // Ignore completely empty rows
                if (fullName.isEmpty() && email.isEmpty()) {
                    continue;
                }

                if (fullName.isEmpty()) {
                    throw new BadRequestException("Upload Failed: Row " + rowNum + " contains an empty fullName. Please correct the details and upload the file again using the provided template.");
                }

                if (email.isEmpty()) {
                    throw new BadRequestException("Upload Failed: Row " + rowNum + " contains an empty email. Please correct the details and upload the file again using the provided template.");
                }

                if (!EMAIL_PATTERN.matcher(email).matches()) {
                    throw new BadRequestException("Upload Failed: Row " + rowNum + " contains an invalid email address. Please correct the details and upload the file again using the provided template.");
                }

                if (seenEmailsInFile.contains(email.toLowerCase())) {
                    throw new BadRequestException("Upload Failed: Row " + rowNum + " contains a duplicate email within the file (" + email + "). Please correct the details and upload the file again using the provided template.");
                }
                seenEmailsInFile.add(email.toLowerCase());

                if (emailExistsInDb != null && emailExistsInDb.test(email)) {
                    throw new BadRequestException("Upload Failed: Row " + rowNum + " email already exists in the system (" + email + "). Please correct the details and upload the file again using the provided template.");
                }

                requests.add(ProjectManagerRequest.builder()
                        .fullName(fullName)
                        .email(email)
                        .build());
            }
            return requests;
        } catch (BadRequestException e) {
            throw e; // rethrow our specific exceptions
        } catch (Exception e) {
            throw new BadRequestException("Failed to parse Excel file. Please check the file format: " + e.getMessage());
        }
    }

    // Helper to safely convert cell data to string regardless of how Excel formatted it
    private static String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell);
    }

    public static java.io.ByteArrayInputStream generateTemplate() {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Project Managers");

            // Create header row
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("fullName");
            headerRow.createCell(1).setCellValue("email");

            // No sample rows as requested

            workbook.write(out);
            return new java.io.ByteArrayInputStream(out.toByteArray());
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel template: " + e.getMessage());
        }
    }
}