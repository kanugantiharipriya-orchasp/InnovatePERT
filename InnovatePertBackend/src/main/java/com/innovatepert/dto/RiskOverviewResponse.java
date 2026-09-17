package com.innovatepert.dto;


public class RiskOverviewResponse {


    private String riskLevel;

    private long projectCount;


    public RiskOverviewResponse() {
    }


    public RiskOverviewResponse(
            String riskLevel,
            long projectCount) {

        this.riskLevel = riskLevel;
        this.projectCount = projectCount;
    }


    public String getRiskLevel() {
        return riskLevel;
    }


    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }


    public long getProjectCount() {
        return projectCount;
    }


    public void setProjectCount(long projectCount) {
        this.projectCount = projectCount;
    }

}