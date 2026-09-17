package com.innovatepert.dto;

public class PriorityDistributionDTO {

    private long high;
    private long medium;
    private long low;

    public PriorityDistributionDTO() {
    }

    public PriorityDistributionDTO(long high, long medium, long low) {
        this.high = high;
        this.medium = medium;
        this.low = low;
    }

    public long getHigh() {
        return high;
    }

    public void setHigh(long high) {
        this.high = high;
    }

    public long getMedium() {
        return medium;
    }

    public void setMedium(long medium) {
        this.medium = medium;
    }

    public long getLow() {
        return low;
    }

    public void setLow(long low) {
        this.low = low;
    }
}