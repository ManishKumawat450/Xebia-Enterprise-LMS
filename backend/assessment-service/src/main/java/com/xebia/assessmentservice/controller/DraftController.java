package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.service.AssessmentCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessments/drafts")
public class DraftController {

    @Autowired
    private AssessmentCacheService cacheService;

    @PostMapping("/{studentId}/{assessmentId}")
    public void saveDraft(@PathVariable String studentId, @PathVariable String assessmentId, @RequestBody Map<String, Object> draftData) {
        cacheService.saveDraft(studentId, assessmentId, draftData);
    }

    @GetMapping("/{studentId}/{assessmentId}")
    public Object getDraft(@PathVariable String studentId, @PathVariable String assessmentId) {
        return cacheService.getDraft(studentId, assessmentId);
    }

    @DeleteMapping("/{studentId}/{assessmentId}")
    public void deleteDraft(@PathVariable String studentId, @PathVariable String assessmentId) {
        cacheService.deleteDraft(studentId, assessmentId);
    }
}
