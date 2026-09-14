package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {

    @Autowired
    private AssessmentService assessmentService;

    @GetMapping
    public List<Assessment> getAllAssessments() {
        return assessmentService.getAllAssessments();
    }

    /**
     * Student-safe view: same assessments but every question without
     * correctAnswer / explanation, so the take-quiz screen never receives the
     * answer key (previously it was in the browser payload during a live quiz).
     */
    @GetMapping("/student")
    public List<java.util.Map<String, Object>> getAssessmentsForStudents() {
        List<java.util.Map<String, Object>> out = new java.util.ArrayList<>();
        for (Assessment a : assessmentService.getAllAssessments()) {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("title", a.getTitle());
            m.put("description", a.getDescription());
            m.put("instructions", a.getInstructions());
            m.put("difficulty", a.getDifficulty());
            m.put("marks", a.getMarks());
            m.put("passingMarks", a.getPassingMarks());
            m.put("duration", a.getDuration());
            m.put("startDate", a.getStartDate());
            m.put("startTime", a.getStartTime());
            m.put("endDate", a.getEndDate());
            m.put("endTime", a.getEndTime());
            m.put("attemptsAllowed", a.getAttemptsAllowed());
            m.put("autoGrade", a.getAutoGrade());
            m.put("manualGrade", a.getManualGrade());
            m.put("status", a.getStatus());
            m.put("type", a.getType());
            m.put("createdBy", a.getCreatedBy());
            m.put("createdAt", a.getCreatedAt());
            m.put("topic", a.getTopic());
            m.put("batches", a.getBatches());
            m.put("shuffleQuestions", a.getShuffleQuestions());
            m.put("randomizeOptions", a.getRandomizeOptions());
            m.put("negativeMarking", a.getNegativeMarking());
            m.put("negativeMarksValue", a.getNegativeMarksValue());
            m.put("autoSubmit", a.getAutoSubmit());
            List<java.util.Map<String, Object>> questions = new java.util.ArrayList<>();
            if (a.getQuestions() != null) {
                for (com.xebia.assessmentservice.model.Question q : a.getQuestions()) {
                    java.util.Map<String, Object> qm = new java.util.LinkedHashMap<>();
                    qm.put("id", q.getId());
                    qm.put("type", q.getType());
                    qm.put("question", q.getQuestion());
                    qm.put("marks", q.getMarks());
                    qm.put("required", q.getRequired());
                    qm.put("options", q.getOptions());
                    questions.add(qm);
                }
            }
            m.put("questions", questions);
            out.add(m);
        }
        return out;
    }

    @PostMapping
    public Assessment createAssessment(@RequestBody Assessment assessment) {
        return assessmentService.createAssessment(assessment);
    }

    @PutMapping("/{id}")
    public Assessment updateAssessment(@PathVariable String id, @RequestBody Assessment assessment) {
        return assessmentService.updateAssessment(id, assessment);
    }

    @DeleteMapping("/{id}")
    public void deleteAssessment(@PathVariable String id) {
        assessmentService.deleteAssessment(id);
    }

    @DeleteMapping("/created-by/{createdBy}")
    public ResponseEntity<java.util.Map<String, Integer>> deleteByCreator(@PathVariable String createdBy) {
        return ResponseEntity.ok(assessmentService.deleteAssessmentsByCreatedBy(createdBy));
    }

    @DeleteMapping("/batch/{batchId}")
    public ResponseEntity<java.util.Map<String, Integer>> deleteByBatchId(@PathVariable String batchId) {
        return ResponseEntity.ok(assessmentService.deleteByBatchId(batchId));
    }
}
