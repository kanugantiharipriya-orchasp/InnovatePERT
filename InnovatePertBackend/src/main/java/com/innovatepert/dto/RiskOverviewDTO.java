package com.innovatepert.dto;

public class RiskOverviewDTO {

    private long lowRisk;
    private long mediumRisk;
    private long highRisk;
    private long veryHighRisk;

    public RiskOverviewDTO() {
    }

    public long getLowRisk() {
        return lowRisk;
    }

    public void setLowRisk(long lowRisk) {
        this.lowRisk = lowRisk;
    }

    public long getMediumRisk() {
        return mediumRisk;
    }

    public void setMediumRisk(long mediumRisk) {
        this.mediumRisk = mediumRisk;
    }

    public long getHighRisk() {
        return highRisk;
    }

    public void setHighRisk(long highRisk) {
        this.highRisk = highRisk;
    }

    public long getVeryHighRisk() {
        return veryHighRisk;
    }

    public void setVeryHighRisk(long veryHighRisk) {
        this.veryHighRisk = veryHighRisk;
    }

}