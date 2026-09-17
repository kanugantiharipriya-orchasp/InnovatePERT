package com.innovatepert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.innovatepert.entity.Project;
import com.innovatepert.entity.User;
import com.innovatepert.enums.Priority;
import com.innovatepert.enums.ProjectStatus;


@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {

    Optional<Project> findByProjectName(String projectName);

    boolean existsByProjectName(String projectName);

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByPriority(Priority priority);

    List<Project> findByProjectNameContainingIgnoreCase(String projectName);

    List<Project> findAllByOrderByProjectNameAsc();

    List<Project> findAllByOrderByProjectNameDesc();

    // ==========================
    // Project Manager
    // ==========================

    Page<Project> findByAssignedTo(
            User assignedTo,
            Pageable pageable);

    List<Project> findByAssignedTo(User assignedTo);

    Page<Project> findByAssignedToAndStatus(
            User assignedTo,
            ProjectStatus status,
            Pageable pageable);

    Page<Project> findByAssignedToAndPriority(
            User assignedTo,
            Priority priority,
            Pageable pageable);

    List<Project> findByAssignedToAndProjectNameContainingIgnoreCase(
            User assignedTo,
            String projectName);

    List<Project> findByAssignedToOrderByProjectNameAsc(
            User assignedTo);

    // ==========================
    // Dashboard
    // ==========================

    long countByStatus(ProjectStatus status);

    long countByPriority(Priority priority);

    @Query("""
            SELECT p
            FROM Project p
            LEFT JOIN FETCH p.assignedTo
            ORDER BY p.createdAt DESC
            """)
    List<Project> findTop5ByOrderByCreatedAtDesc(Pageable pageable);

    // ==========================
    // Risk Overview
    // ==========================

    long countByCompletionProbabilityGreaterThan(Double probability);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.completionProbability BETWEEN :start AND :end")
    long countByCompletionProbabilityBetween(
            Double start,
            Double end);

    long countByCompletionProbabilityLessThan(Double probability);

 // ==========================
 // Project Manager Dashboard
 // ==========================

 long countByAssignedTo(User assignedTo);

 long countByAssignedToAndStatus(
         User assignedTo,
         ProjectStatus status);


 @Query("""
        SELECT COUNT(p)
        FROM Project p
        WHERE p.targetDate >= CURRENT_DATE
        """)
 long countUpcomingDeadlines();


 @Query("""
        SELECT COUNT(p)
        FROM Project p
        WHERE p.completionProbability < 50
        """)
 long countProjectsAtRisk();

 List<Project> findByAssignedToIn(List<User> managers);

    // ==========================
    // Admin Scope Filtering
    // ==========================

    @Query("SELECT DISTINCT p FROM Project p WHERE p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)")
    List<Project> findProjectsByAdmin(@Param("admin") User admin);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)")
    long countProjectsByAdmin(@Param("admin") User admin);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE (p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)) AND p.status = :status")
    long countProjectsByAdminAndStatus(@Param("admin") User admin, @Param("status") ProjectStatus status);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE (p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)) AND p.priority = :priority")
    long countProjectsByAdminAndPriority(@Param("admin") User admin, @Param("priority") Priority priority);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE (p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)) AND p.completionProbability < 50.0")
    long countProjectsByAdminAtRisk(@Param("admin") User admin);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE (p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)) AND p.completionProbability >= :minProb AND p.completionProbability < :maxProb")
    long countProjectsByAdminRiskLevel(@Param("admin") User admin, @Param("minProb") double minProb,
            @Param("maxProb") double maxProb);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p WHERE (p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin)) AND p.completionProbability >= :minProb")
    long countProjectsByAdminRiskLevelMin(@Param("admin") User admin,
            @Param("minProb") double minProb);

    @Query("SELECT DISTINCT p FROM Project p WHERE p.assignedBy = :admin OR (p.assignedTo IS NOT NULL AND p.assignedTo.createdByAdmin = :admin) ORDER BY p.createdAt DESC")
    List<Project> findRecentProjectsByAdmin(@Param("admin") User admin, Pageable pageable);

    // ==========================
    // Deleted Projects Handling
    // ==========================

    @Query(value = "SELECT * FROM projects WHERE is_deleted = true AND (assigned_by = :adminId OR assigned_to IN (SELECT user_id FROM users WHERE created_by_admin = :adminId)) ORDER BY created_at DESC", nativeQuery = true)
    List<Project> findDeletedProjectsByAdmin(@Param("adminId") Integer adminId);

    @Query(value = "SELECT * FROM projects WHERE project_id = :projectId AND is_deleted = true", nativeQuery = true)
    Optional<Project> findDeletedById(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "UPDATE projects SET is_deleted = false WHERE project_id = :projectId", nativeQuery = true)
    void restoreProjectNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM projects WHERE project_id = :projectId", nativeQuery = true)
    void hardDeleteNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM dependencies WHERE project_id = :projectId OR predecessor_project_id = :projectId", nativeQuery = true)
    void hardDeleteDependenciesNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM pert_results WHERE project_id = :projectId", nativeQuery = true)
    void hardDeletePertResultsNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM crashing WHERE project_id = :projectId", nativeQuery = true)
    void hardDeleteCrashingNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM risk_analysis WHERE project_id = :projectId", nativeQuery = true)
    void hardDeleteRiskAnalysisNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM reports WHERE project_id = :projectId", nativeQuery = true)
    void hardDeleteReportsNative(@Param("projectId") Integer projectId);

    @Modifying
    @Query(value = "DELETE FROM activities WHERE project_id = :projectId", nativeQuery = true)
    void hardDeleteActivitiesNative(@Param("projectId") Integer projectId);
}