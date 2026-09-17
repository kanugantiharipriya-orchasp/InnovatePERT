package com.innovatepert.service;

import com.innovatepert.dto.request.CrashingAnalysisRequestDTO;
import com.innovatepert.dto.response.CrashingAnalysisResponseDTO;

public interface CrashingAnalysisService {

    CrashingAnalysisResponseDTO runCrashingAnalysis(CrashingAnalysisRequestDTO request);

    CrashingAnalysisResponseDTO getProjectCrashingOverview(Integer projectId);

    CrashingAnalysisResponseDTO submitCrashingAnalysis(CrashingAnalysisResponseDTO response);
}
