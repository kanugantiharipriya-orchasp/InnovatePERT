package com.innovatepert.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.innovatepert.dto.request.ActivityRequest;
import com.innovatepert.dto.request.ActivityStatusRequest;
import com.innovatepert.dto.response.ActivityResponse;
import com.innovatepert.enums.ActivityStatus;
import com.innovatepert.service.ActivityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityResponse> createActivity(
            @Valid @RequestBody ActivityRequest request) {

        return new ResponseEntity<>(
                activityService.createActivity(request),
                HttpStatus.CREATED);
    }


    @GetMapping
    public ResponseEntity<List<ActivityResponse>> getAllActivities() {

        return ResponseEntity.ok(
                activityService.getAllActivities());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ActivityResponse>> getActivitiesByProject(
            @PathVariable Integer projectId) {

        return ResponseEntity.ok(
                activityService.getActivitiesByProject(projectId));
    }


    @PutMapping("/{activityId}")
    public ResponseEntity<ActivityResponse> updateActivity(
            @PathVariable Long activityId,
            @Valid @RequestBody ActivityRequest request) {

        return ResponseEntity.ok(
                activityService.updateActivity(activityId, request));
    }

    @PatchMapping("/{activityId}/status")
    public ResponseEntity<ActivityResponse> updateActivityStatus(
            @PathVariable Long activityId,
            @Valid @RequestBody ActivityStatusRequest request) {

        return ResponseEntity.ok(
                activityService.updateActivityStatus(activityId, request.getStatus()));
    }

    @DeleteMapping("/{activityId}")
    public ResponseEntity<String> deleteActivity(
            @PathVariable Long activityId) {

        activityService.deleteActivity(activityId);

        return ResponseEntity.ok("Activity deleted successfully.");
    }
}