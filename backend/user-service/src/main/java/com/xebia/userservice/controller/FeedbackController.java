package com.xebia.userservice.controller;

import com.xebia.userservice.model.Feedback;
import com.xebia.userservice.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping
    public List<Feedback> getFeedback(@RequestParam(required = false) String studentId) {
        return feedbackService.getAllFeedback(studentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Feedback submitFeedback(@RequestBody Feedback feedback) {
        return feedbackService.submitFeedback(feedback);
    }
}
