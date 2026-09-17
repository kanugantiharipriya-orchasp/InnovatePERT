package com.innovatepert.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectBudgetSummaryResponse {

    private Double projectBudget;
    private Double allocatedBudget;
    private Double remainingBudget;

}
