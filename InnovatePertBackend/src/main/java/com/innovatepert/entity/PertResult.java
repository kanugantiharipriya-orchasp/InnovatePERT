package com.innovatepert.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "pert_results",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"activity_id"}, name = "uk_pert_activity")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PertResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pert_id")
    private Long pertId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Column(name = "optimistic_time", nullable = false)
    private Double optimisticTime;

    @Column(name = "most_likely_time", nullable = false)
    private Double mostLikelyTime;

    @Column(name = "pessimistic_time", nullable = false)
    private Double pessimisticTime;

    @Column(name = "expected_time", nullable = false)
    private Double expectedTime;

    @Column(name = "variance", nullable = false)
    private Double variance;

    @Column(name = "standard_deviation", nullable = false)
    private Double standardDeviation;

    @Column(name = "actual_time")
   private Double actualTime;

    @CreationTimestamp
    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;
}