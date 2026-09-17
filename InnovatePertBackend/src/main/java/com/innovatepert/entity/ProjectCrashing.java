package com.innovatepert.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "crashing")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCrashing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Long detailId;

    @Column(name = "crashing_id", nullable = false)
    private Long crashingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id")
    private Activity activity;

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "normal_time")
    private Double normalTime;

    @Column(name = "crash_time")
    private Double crashTime;

    @Column(name = "time_saved")
    private Double timeSaved;

    @Column(name = "normal_cost")
    private Double normalCost;

    @Column(name = "crash_cost")
    private Double crashCost;

    @Column(name = "additional_cost")
    private Double additionalCost;

    @Column(name = "cost_slope")
    private Double costSlope;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "recommendation")
    private String recommendation;

    @Column(name = "recommended")
    private Boolean recommended;

    @Column(name = "current_duration")
    private Double currentDuration;

    @Column(name = "target_duration")
    private Double targetDuration;

    @Column(name = "total_time_saved")
    private Double totalTimeSaved;

    @Column(name = "total_additional_cost")
    private Double totalAdditionalCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
