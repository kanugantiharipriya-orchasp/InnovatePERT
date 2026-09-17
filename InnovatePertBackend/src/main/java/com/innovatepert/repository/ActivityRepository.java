package com.innovatepert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Project;
import com.innovatepert.enums.ActivityStatus;

public interface ActivityRepository extends JpaRepository<Activity, Long> {


    // Check duplicate activity name within the same project
    boolean existsByProjectAndActivityNameIgnoreCase(
            Project project,
            String activityName);



    // Find activity by project and activity name
    Optional<Activity> findByProjectAndActivityNameIgnoreCase(
            Project project,
            String activityName);



    // Get all activities of a project
    List<Activity> findByProject(Project project);


    
    List<Activity> findByProject_ProjectId(Long projectId);
    
    // Get activities by status
    List<Activity> findByStatus(ActivityStatus status);



    // Search activities by name within a project
    List<Activity> findByProjectAndActivityNameContainingIgnoreCase(
            Project project,
            String activityName);



    // Sort activities by name (Ascending)
    List<Activity> findAllByOrderByActivityNameAsc();
    



    // Sort activities by name (Descending)
    List<Activity> findAllByOrderByActivityNameDesc();



    // Get activities by project id
    List<Activity> findByProject_ProjectId(Integer projectId);

    // Sum of normal cost for a project
    @Query("SELECT COALESCE(SUM(a.normalCost), 0.0) FROM Activity a WHERE a.project.projectId = :projectId")
    Double sumNormalCostByProjectId(@Param("projectId") Integer projectId);



    // ==========================
    // Project Manager Dashboard
    // ==========================


    // Count all activities by status
    long countByStatus(ActivityStatus status);



    // Count activities inside a project
    long countByProject(Project project);



    // Count activities by project and status
    long countByProjectAndStatus(
            Project project,
            ActivityStatus status);

    long countByProject_AssignedTo(com.innovatepert.entity.User manager);

    long countByProject_AssignedToAndStatus(com.innovatepert.entity.User manager, ActivityStatus status);

    // Scoped Admin activity counts
    long countByProjectIn(List<Project> projects);

    long countByProjectInAndStatus(List<Project> projects, ActivityStatus status);
}