package com.innovatepert.dto.response;


import java.time.LocalDateTime;
import com.innovatepert.enums.ActivityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PertResultResponseDTO {

    private Long pertId;
    private Integer projectId;
    private String projectName;
    private Long activityId;
    private String activityName;
    private String description;
    private ActivityStatus activityStatus;
    
    // Time Estimates
    private Double optimisticTime;
    private Double mostLikelyTime;
    private Double pessimisticTime;
    private Double expectedTime;
    
    // PERT Metrics
    private Double variance;
    private Double standardDeviation;
    private Double actualTime;
    private LocalDateTime calculatedAt;
}
