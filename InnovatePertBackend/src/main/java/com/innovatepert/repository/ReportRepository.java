package com.innovatepert.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.innovatepert.entity.Project;
import com.innovatepert.entity.Report;
import com.innovatepert.entity.User;
import com.innovatepert.enums.ReportType;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    List<Report> findByProject(Project project);

    List<Report> findByProjectAndReportType(Project project, ReportType reportType);

    List<Report> findByGeneratedBy(User generatedBy);
}
