package com.innovatepert.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.innovatepert.enums.ActivityStatus;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "activities",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "activity_name"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "activity_id")
    private Long activityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "activity_name", nullable = false, length = 100)
    private String activityName;

//    @Column(length = 500)
//    private String description;

    @Column(name = "optimistic_time", nullable = false)
    private Double optimisticTime;

    @Column(name = "most_likely_time", nullable = false)
    private Double mostLikelyTime;

    @Column(name = "pessimistic_time", nullable = false)
    private Double pessimisticTime;

    @Column(name = "expected_time", nullable = false)
    private Double expectedTime;

    @Column(nullable = false)
    private Double variance;

    @Column(name = "normal_time", nullable = false)
    private Double normalTime;

    @Column(name = "normal_cost", nullable = false)
    private Double normalCost;

    @Column(name = "crash_time")
    private Double crashTime;

    @Column(name = "crash_cost")
    private Double crashCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

}