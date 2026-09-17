package com.innovatepert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.innovatepert.entity.PertResult;

@Repository
public interface PertResultRepository extends JpaRepository<PertResult, Long> {

    // Fetch all PERT results for a specific project
    List<PertResult> findByProject_ProjectId(Integer projectId);

    // Fetch PERT result for a specific activity
    Optional<PertResult> findByActivity_ActivityId(Long activityId);

    // Fetch PERT result for a specific activity within a specific project
    Optional<PertResult> findByProject_ProjectIdAndActivity_ActivityId(Integer projectId, Long activityId);

    // Check if PERT result exists for an activity
    boolean existsByActivity_ActivityId(Long activityId);

    // Delete all PERT results belonging to a project
    void deleteByProject_ProjectId(Integer projectId);
}