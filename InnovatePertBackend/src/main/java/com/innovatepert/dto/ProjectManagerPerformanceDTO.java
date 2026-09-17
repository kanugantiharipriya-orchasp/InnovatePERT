package com.innovatepert.dto;

public class ProjectManagerPerformanceDTO {

    private Integer managerId;
    private String managerName;

    private long totalProjects;
    private long completedProjects;
    private long inProgressProjects;
    private long notStartedProjects;

    public ProjectManagerPerformanceDTO() {
    }

    public ProjectManagerPerformanceDTO(Integer managerId,
                                        String managerName,
                                        long totalProjects,
                                        long completedProjects,
                                        long inProgressProjects,
                                        long notStartedProjects) {
        this.managerId = managerId;
        this.managerName = managerName;
        this.totalProjects = totalProjects;
        this.completedProjects = completedProjects;
        this.inProgressProjects = inProgressProjects;
        this.notStartedProjects = notStartedProjects;
    }

    public Integer getManagerId() {
        return managerId;
    }

    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public long getTotalProjects() {
        return totalProjects;
    }

    public void setTotalProjects(long totalProjects) {
        this.totalProjects = totalProjects;
    }

    public long getCompletedProjects() {
        return completedProjects;
    }

    public void setCompletedProjects(long completedProjects) {
        this.completedProjects = completedProjects;
    }

    public long getInProgressProjects() {
        return inProgressProjects;
    }

    public void setInProgressProjects(long inProgressProjects) {
        this.inProgressProjects = inProgressProjects;
    }

    public long getNotStartedProjects() {
        return notStartedProjects;
    }

    public void setNotStartedProjects(long notStartedProjects) {
        this.notStartedProjects = notStartedProjects;
    }

}