package com.innovatepert.mapper;

import org.springframework.stereotype.Component;

import com.innovatepert.dto.response.DependencyResponse;
import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Dependency;
import com.innovatepert.entity.Project;
import com.innovatepert.enums.ActivityStatus;

@Component
public class DependencyMapper {

    public DependencyResponse toResponse(Dependency dependency) {
        if (dependency == null) return null;

        Project proj = dependency.getProject();
        Project predProj = dependency.getPredecessorProject();
        Activity predAct = dependency.getPredecessorActivity();
        Activity succAct = dependency.getSuccessorActivity();

        boolean isBlocked = false;
        String depStatus = "READY";
        StringBuilder reason = new StringBuilder();
        StringBuilder relationship = new StringBuilder();

        // Target Project metadata
        String projName = proj != null ? proj.getProjectName() : "N/A";
        String projStatusStr = proj != null && proj.getStatus() != null ? proj.getStatus().name() : "N/A";
        Double projProgress = proj != null && proj.getCompletionProbability() != null ? proj.getCompletionProbability() : 0.0;
        String projPM = proj != null && proj.getAssignedTo() != null ? proj.getAssignedTo().getFullName() : "Unassigned";

        // Predecessor Project metadata
        String predProjName = predProj != null ? predProj.getProjectName() : null;
        String predProjStatusStr = predProj != null && predProj.getStatus() != null ? predProj.getStatus().name() : null;
        Double predProjProgress = predProj != null && predProj.getCompletionProbability() != null ? predProj.getCompletionProbability() : null;
        String predProjPM = predProj != null && predProj.getAssignedTo() != null ? predProj.getAssignedTo().getFullName() : null;

        // Predecessor Activity metadata
        String predActName = predAct != null ? predAct.getActivityName() : null;
        String predActStatusStr = predAct != null && predAct.getStatus() != null ? predAct.getStatus().name() : null;
        Double predActProgress = predAct != null ? (predAct.getStatus() == ActivityStatus.COMPLETED ? 100.0 : (predAct.getStatus() == ActivityStatus.IN_PROGRESS ? 50.0 : 0.0)) : null;

        // Successor Activity metadata
        String succActName = succAct != null ? succAct.getActivityName() : null;
        String succActStatusStr = succAct != null && succAct.getStatus() != null ? succAct.getStatus().name() : null;
        Double succActProgress = succAct != null ? (succAct.getStatus() == ActivityStatus.COMPLETED ? 100.0 : (succAct.getStatus() == ActivityStatus.IN_PROGRESS ? 50.0 : 0.0)) : null;

        // Format Activity-to-Activity Relationship Sentence & Calculate Status
        if (predAct != null && succAct != null) {
            relationship.append(succActName).append(" depends on ").append(predActName);
            if (predAct.getStatus() == ActivityStatus.COMPLETED) {
                depStatus = "SATISFIED";
                reason.append("Satisfied - ").append(predActName).append(" is completed.");
            } else {
                isBlocked = true;
                depStatus = "BLOCKED";
                reason.append("Blocked because ").append(predActName).append(" has not been completed (Currently ").append(predActStatusStr).append(").");
            }
        } else if (predProj != null && succAct == null) {
            relationship.append("Project '").append(projName).append("' depends on Project '").append(predProjName).append("'");
            if (predProj.getStatus() == com.innovatepert.enums.ProjectStatus.COMPLETED) {
                depStatus = "SATISFIED";
                reason.append("Satisfied - Project '").append(predProjName).append("' is completed.");
            } else {
                isBlocked = true;
                depStatus = "BLOCKED";
                reason.append("Blocked because Project '").append(predProjName).append("' is ").append(predProjStatusStr).append(".");
            }
        } else if (predProj != null && succAct != null) {
            relationship.append(succActName).append(" depends on Project '").append(predProjName).append("'");
            if (predProj.getStatus() == com.innovatepert.enums.ProjectStatus.COMPLETED) {
                depStatus = "SATISFIED";
                reason.append("Satisfied - Project '").append(predProjName).append("' is completed.");
            } else {
                isBlocked = true;
                depStatus = "BLOCKED";
                reason.append("Blocked because Project '").append(predProjName).append("' is ").append(predProjStatusStr).append(".");
            }
        } else {
            relationship.append("Dependency link defined for Project '").append(projName).append("'");
            reason.append("Dependency active.");
        }

        return DependencyResponse.builder()
                .dependencyId(dependency.getDependencyId())

                // Dependent Project Metadata
                .projectId(proj != null ? proj.getProjectId() : null)
                .projectName(projName)
                .projectStatus(projStatusStr)
                .projectProgress(projProgress)
                .projectAssignedPM(projPM)

                // Predecessor Project Metadata
                .predecessorProjectId(predProj != null ? predProj.getProjectId() : null)
                .predecessorProjectName(predProjName)
                .predecessorProjectStatus(predProjStatusStr)
                .predecessorProjectProgress(predProjProgress)
                .predecessorProjectAssignedPM(predProjPM)

                // Predecessor Activity Metadata
                .predecessorActivityId(predAct != null ? predAct.getActivityId() : null)
                .predecessorActivityName(predActName)
                .predecessorActivityStatus(predActStatusStr)
                .predecessorActivityProgress(predActProgress)

                // Successor Activity Metadata
                .successorActivityId(succAct != null ? succAct.getActivityId() : null)
                .successorActivityName(succActName)
                .successorActivityStatus(succActStatusStr)
                .successorActivityProgress(succActProgress)

                // Status & Relationship Info
                .dependencyType(dependency.getDependencyType() != null ? dependency.getDependencyType() : "FS")
                .dependencyStatus(depStatus)
                .isBlocked(isBlocked)
                .blockReason(reason.toString())
                .relationshipSentence(relationship.toString())
                .build();
    }
}