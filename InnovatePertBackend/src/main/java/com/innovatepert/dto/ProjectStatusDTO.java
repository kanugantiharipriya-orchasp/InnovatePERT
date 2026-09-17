package com.innovatepert.dto;

public class ProjectStatusDTO {

    private long assigned;
    private long notStarted;
    private long inProgress;
    private long completed;

    public ProjectStatusDTO() {
    }

    public ProjectStatusDTO(long assigned,
                            long notStarted,
                            long inProgress,
                            long completed) {
        this.assigned = assigned;
        this.notStarted = notStarted;
        this.inProgress = inProgress;
        this.completed = completed;
    }

    public long getAssigned() {
        return assigned;
    }

    public void setAssigned(long assigned) {
        this.assigned = assigned;
    }

    public long getNotStarted() {
        return notStarted;
    }

    public void setNotStarted(long notStarted) {
        this.notStarted = notStarted;
    }

    public long getInProgress() {
        return inProgress;
    }

    public void setInProgress(long inProgress) {
        this.inProgress = inProgress;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

}