package com.innovatepert.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DependencyResponse {

    private Long dependencyId;

    // Dependent / Target Project Metadata
    private Integer projectId;
    private String projectName;
    private String projectStatus;
    private Double projectProgress;
    private String projectAssignedPM;

    // Prerequisite / Predecessor Project Metadata
    private Integer predecessorProjectId;
    private String predecessorProjectName;
    private String predecessorProjectStatus;
    private Double predecessorProjectProgress;
    private String predecessorProjectAssignedPM;

    // Prerequisite / Predecessor Activity Metadata
    private Long predecessorActivityId;
    private String predecessorActivityName;
    private String predecessorActivityStatus;
    private Double predecessorActivityProgress;

    // Dependent / Successor Activity Metadata
    private Long successorActivityId;
    private String successorActivityName;
    private String successorActivityStatus;
    private Double successorActivityProgress;

    // Relationship & Status Metadata
    private String dependencyType;
    private String dependencyStatus; // "BLOCKED", "READY", "SATISFIED"
    private Boolean isBlocked;
    private String blockReason;
    private String relationshipSentence; // e.g. "Activity B depends on Activity A" or "Project B depends on Project A"
}