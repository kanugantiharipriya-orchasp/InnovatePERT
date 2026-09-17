package com.innovatepert.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.innovatepert.entity.RiskAnalysis;

public interface RiskAnalysisRepository extends JpaRepository<RiskAnalysis, Integer> {

    Optional<RiskAnalysis> findByProject_ProjectId(Integer projectId);

    @Query("""
            SELECT COALESCE(SUM(p.expectedTime), 0)
            FROM PertResult p
            WHERE p.project.projectId = :projectId
        """)
        Double getTotalExpectedTime(Integer projectId);

        @Query("""
            SELECT COALESCE(SUM(p.variance), 0)
            FROM PertResult p
            WHERE p.project.projectId = :projectId
        """)
        Double getTotalVariance(Integer projectId);
}