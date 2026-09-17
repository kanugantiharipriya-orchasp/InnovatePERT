package com.innovatepert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.innovatepert.entity.Activity;
import com.innovatepert.entity.Dependency;
import com.innovatepert.entity.Project;

public interface DependencyRepository extends JpaRepository<Dependency, Long> {

    // Check duplicate activity dependency
    boolean existsByProjectAndPredecessorActivityAndSuccessorActivity(
            Project project,
            Activity predecessorActivity,
            Activity successorActivity);

    // Check duplicate project dependency
    boolean existsByProjectAndPredecessorProject(
            Project project,
            Project predecessorProject);

    // Find duplicate dependency
    Optional<Dependency> findByProjectAndPredecessorActivityAndSuccessorActivity(
            Project project,
            Activity predecessorActivity,
            Activity successorActivity);

    // All dependencies of a project
    List<Dependency> findByProject(Project project);

    // All dependencies where this project is predecessor
    List<Dependency> findByPredecessorProject(Project predecessorProject);

    // Find all predecessors of an activity
    List<Dependency> findBySuccessorActivity(Activity successorActivity);

    // Find all successors of an activity
    List<Dependency> findByPredecessorActivity(Activity predecessorActivity);

    // Check whether an activity is used in any dependency
    boolean existsByPredecessorActivityOrSuccessorActivity(
            Activity predecessorActivity,
            Activity successorActivity);
    
    boolean existsByPredecessorActivity(Activity predecessorActivity);

    boolean existsBySuccessorActivity(Activity successorActivity);

    // Scoped Admin dependency count
    long countByProjectIn(List<Project> projects);
}