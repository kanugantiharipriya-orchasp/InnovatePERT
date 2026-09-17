package com.innovatepert.dto.request;

import com.innovatepert.enums.ActivityStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityStatusRequest {

    @NotNull(message = "Status cannot be null")
    private ActivityStatus status;

}
