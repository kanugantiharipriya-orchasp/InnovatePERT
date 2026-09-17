package com.innovatepert.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dependencies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dependencyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predecessor_project_id", nullable = true)
    private Project predecessorProject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predecessor_activity_id", nullable = true)
    private Activity predecessorActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "successor_activity_id", nullable = true)
    private Activity successorActivity;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String dependencyType = "FS";
}