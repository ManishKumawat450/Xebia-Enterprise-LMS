package com.xebia.userservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String role; // "teacher" or "student"
    private String department;
    private String avatar;
    
    // Student specific stats
    private Integer averageScore;
    private Integer assessmentsCompleted;

    // BCrypt hash only; never serialize credential material to API responses.
    @JsonIgnore
    private String passwordHash;

    @JsonIgnore
    private Boolean mustChangePassword = false;
}
