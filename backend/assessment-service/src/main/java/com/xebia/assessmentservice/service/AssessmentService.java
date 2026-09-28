package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssessmentService {
    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private com.xebia.assessmentservice.repository.SubmissionRepository submissionRepository;

    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    private void sanitizeQuestionIds(Assessment assessment) {
        if (assessment.getQuestions() != null) {
            for (com.xebia.assessmentservice.model.Question q : assessment.getQuestions()) {
                if (q.getId() != null) {
                    try {
                        java.util.UUID.fromString(q.getId());
                    } catch (IllegalArgumentException e) {
                        q.setId(null);
                    }
                }
            }
        }
    }

    public Assessment createAssessment(Assessment assessment) {
        validate(assessment, true);
        sanitizeQuestionIds(assessment);
        return assessmentRepository.save(assessment);
    }

    /**
     * Creation/edit-time rules that used to be silently accepted: missing
     * title, zero duration/marks, out-of-range passing marks, publishing with
     * no questions or no batch, and duplicate titles on create.
     * IllegalArgumentException is mapped to HTTP 400 by GlobalExceptionHandler.
     */
    private void validate(Assessment a, boolean isCreate) {
        if (a.getTitle() == null || a.getTitle().isBlank()) {
            throw new IllegalArgumentException("Validation: title is required");
        }
        if (a.getDuration() != null && a.getDuration() <= 0) {
            throw new IllegalArgumentException("Validation: duration must be greater than 0 minutes");
        }
        if (a.getMarks() != null && a.getMarks() <= 0) {
            throw new IllegalArgumentException("Validation: total marks must be greater than 0");
        }
        if (a.getPassingMarks() != null && (a.getPassingMarks() < 0 || a.getPassingMarks() > 100)) {
            throw new IllegalArgumentException("Validation: passing marks must be between 0 and 100 (it is a percentage)");
        }
        if ("published".equalsIgnoreCase(a.getStatus())) {
            if (a.getQuestions() == null || a.getQuestions().isEmpty()) {
                throw new IllegalArgumentException("Validation: a published assessment needs at least one question");
            }
            if (a.getBatches() == null || a.getBatches().isEmpty()) {
                throw new IllegalArgumentException("Validation: assign at least one batch before publishing");
            }
        }
        if (isCreate) {
            String title = a.getTitle().trim();
            boolean dup = assessmentRepository.findAll().stream()
                    .anyMatch(x -> x.getTitle() != null && x.getTitle().trim().equalsIgnoreCase(title));
            if (dup) {
                throw new IllegalArgumentException("Validation: an assessment with the title \"" + title + "\" already exists");
            }
        }
    }

    public Assessment updateAssessment(String id, Assessment updated) {
        java.util.Optional<Assessment> existingOpt = assessmentRepository.findById(id);
        if (existingOpt.isPresent()) {
            Assessment existing = existingOpt.get();
            if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getInstructions() != null) existing.setInstructions(updated.getInstructions());
            if (updated.getDifficulty() != null) existing.setDifficulty(updated.getDifficulty());
            if (updated.getMarks() != null) existing.setMarks(updated.getMarks());
            if (updated.getPassingMarks() != null) existing.setPassingMarks(updated.getPassingMarks());
            if (updated.getDuration() != null) existing.setDuration(updated.getDuration());
            if (updated.getStartDate() != null) existing.setStartDate(updated.getStartDate());
            if (updated.getStartTime() != null) existing.setStartTime(updated.getStartTime());
            if (updated.getEndDate() != null) existing.setEndDate(updated.getEndDate());
            if (updated.getEndTime() != null) existing.setEndTime(updated.getEndTime());
            if (updated.getAttemptsAllowed() != null) existing.setAttemptsAllowed(updated.getAttemptsAllowed());
            if (updated.getAutoGrade() != null) existing.setAutoGrade(updated.getAutoGrade());
            if (updated.getManualGrade() != null) existing.setManualGrade(updated.getManualGrade());
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            if (updated.getType() != null) existing.setType(updated.getType());
            if (updated.getTopic() != null) existing.setTopic(updated.getTopic());
            if (updated.getShuffleQuestions() != null) existing.setShuffleQuestions(updated.getShuffleQuestions());
            if (updated.getRandomizeOptions() != null) existing.setRandomizeOptions(updated.getRandomizeOptions());
            if (updated.getNegativeMarking() != null) existing.setNegativeMarking(updated.getNegativeMarking());
            if (updated.getNegativeMarksValue() != null) existing.setNegativeMarksValue(updated.getNegativeMarksValue());
            if (updated.getAutoSubmit() != null) existing.setAutoSubmit(updated.getAutoSubmit());
            if (updated.getBatches() != null) {
                if (existing.getBatches() != null) {
                    existing.getBatches().clear();
                    existing.getBatches().addAll(updated.getBatches());
                } else {
                    existing.setBatches(updated.getBatches());
                }
            }
            if (updated.getQuestions() != null) {
                if (existing.getQuestions() != null) {
                    existing.getQuestions().clear();
                    existing.getQuestions().addAll(updated.getQuestions());
                } else {
                    existing.setQuestions(updated.getQuestions());
                }
            }
            validate(existing, false);
            sanitizeQuestionIds(existing);
            return assessmentRepository.save(existing);
        }
        validate(updated, false);
        sanitizeQuestionIds(updated);
        return assessmentRepository.save(updated);
    }

    public void deleteAssessment(String id) {
        assessmentRepository.deleteById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Integer> deleteAssessmentsByCreatedBy(String createdBy) {
        java.util.List<Assessment> assessments = assessmentRepository.findByCreatedBy(createdBy);
        int assessmentCount = assessments.size();
        int submissionCount = 0;
        for (Assessment a : assessments) {
            java.util.List<com.xebia.assessmentservice.model.Submission> subs = submissionRepository.findByAssessmentId(a.getId());
            submissionCount += subs.size();
            submissionRepository.deleteAll(subs);
        }
        assessmentRepository.deleteAll(assessments);
        return java.util.Map.of("assessments", assessmentCount, "submissions", submissionCount);
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Integer> deleteByBatchId(String batchId) {
        java.util.List<Assessment> all = assessmentRepository.findAll();
        java.util.List<Assessment> matching = new java.util.ArrayList<>();
        for (Assessment a : all) {
            if (a.getBatches() != null && a.getBatches().contains(batchId)) {
                matching.add(a);
            }
        }
        int assessmentCount = matching.size();
        int submissionCount = 0;
        for (Assessment a : matching) {
            java.util.List<com.xebia.assessmentservice.model.Submission> subs = submissionRepository.findByAssessmentId(a.getId());
            submissionCount += subs.size();
            submissionRepository.deleteAll(subs);
        }
        assessmentRepository.deleteAll(matching);
        return java.util.Map.of("assessments", assessmentCount, "submissions", submissionCount);
    }
}
