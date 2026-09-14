package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    private String id;
    
    private String assessmentId;
    private String studentId;
    private String status; // in_progress, submitted
    private String startedAt;
    private String submittedAt;
    private Double score;
    private Integer percentage;
    private Integer timeTaken;
    private Boolean isEvaluated;
    @Column(columnDefinition = "TEXT")
    private String remarks;
    private String evaluatedBy;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "submission_id")
    private List<Answer> answers;
}

