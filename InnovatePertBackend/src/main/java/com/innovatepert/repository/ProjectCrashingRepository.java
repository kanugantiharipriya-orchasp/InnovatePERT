package com.innovatepert.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Project;
import com.innovatepert.entity.ProjectCrashing;

public interface ProjectCrashingRepository extends JpaRepository<ProjectCrashing, Long> {

    List<ProjectCrashing> findByProject(Project project);

    List<ProjectCrashing> findByProject_ProjectId(Integer projectId);

    List<ProjectCrashing> findByCrashingId(Long crashingId);

    List<ProjectCrashing> findByProject_ProjectIdAndCrashingId(Integer projectId, Long crashingId);

    List<ProjectCrashing> findByActivity(Activity activity);
}
