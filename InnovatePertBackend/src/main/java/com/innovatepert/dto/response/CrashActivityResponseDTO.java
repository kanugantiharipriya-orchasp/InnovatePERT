package com.innovatepert.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrashActivityResponseDTO {

    private Long activityId;

    private String activityName;

    private Double normalTime;

    private Double crashTime;

    private Double timeSaved;

    private Double normalCost;

    private Double crashCost;

    private Double additionalCost;

    private Double costSlope; // Cost Per Day Saved

    private Integer priority;

    private String recommendation; // e.g. "⭐ Crash First"

    private Boolean recommended;
}