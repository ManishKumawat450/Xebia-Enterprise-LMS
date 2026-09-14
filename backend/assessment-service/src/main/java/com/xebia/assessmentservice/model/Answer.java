package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String questionId;
    @Column(columnDefinition = "TEXT")
    private String answer;
    private Double marksAwarded;
    @Column(columnDefinition = "TEXT")
    private String remarks;
}
