package com.xebia.userservice.service;

import com.xebia.userservice.model.Feedback;
import com.xebia.userservice.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FeedbackService {
    @Autowired
    private FeedbackRepository feedbackRepository;

    public Feedback submitFeedback(Feedback feedback) {
        if (feedback.getCreatedAt() == null || feedback.getCreatedAt().isBlank()) {
            feedback.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedback(String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return feedbackRepository.findByStudentId(studentId);
        }
        return feedbackRepository.findAll();
    }
}
