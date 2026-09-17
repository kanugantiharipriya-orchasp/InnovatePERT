package com.innovatepert.service;

import java.util.List;

import com.innovatepert.dto.request.DependencyRequest;
import com.innovatepert.dto.response.DependencyResponse;

public interface DependencyService {

    DependencyResponse createDependency(DependencyRequest request);

    List<DependencyResponse> getDependenciesByProject(Integer projectId);


    void deleteDependency(Long dependencyId);
}