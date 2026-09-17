package com.innovatepert.dto;

public class ProjectProgressResponse {

    private String projectName;

    private int completion;


    public ProjectProgressResponse() {
    }


    public ProjectProgressResponse(String projectName, int completion) {
        this.projectName = projectName;
        this.completion = completion;
    }


    public String getProjectName() {
        return projectName;
    }


    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }


    public int getCompletion() {
        return completion;
    }


    public void setCompletion(int completion) {
        this.completion = completion;
    }
}