package com.xebia.userservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String studentId;
    private String studentName;
    private String trainerId;
    private String trainerName;
    private String batchId;
    private String batchName;

    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private String createdAt;
}
