package com.xebia.assessmentservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentReportRowDto {
    private String studentId;
    private String studentName;
    private String email;
    private String batch;
    private String course;
    private Double score;
    private Integer percentage;
    private String passFail;
    private String attemptStatus;
    private String startTime;
    private String endTime;
    private Integer timeTaken;
    private String submissionStatus;
    private String remarks;
}
