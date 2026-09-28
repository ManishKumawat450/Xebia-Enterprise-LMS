package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String type;
    @Column(columnDefinition = "TEXT")
    private String question;
    private Integer marks;
    private Boolean required;
    
    @ElementCollection
    @Column(columnDefinition = "TEXT")
    private List<String> options;
    
    @Column(columnDefinition = "TEXT")
    private String correctAnswer;
    @Column(columnDefinition = "TEXT")
    private String explanation;

    // Preserve type-specific fields (coding settings, file constraints, etc.)
    // instead of silently dropping them during JSON/JPA round-trips.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata = new java.util.HashMap<>();

    @JsonAnySetter
    public void captureExtraField(String key, Object value) {
        if (metadata == null) metadata = new java.util.HashMap<>();
        metadata.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> getExtraFields() {
        return metadata == null ? java.util.Collections.emptyMap() : metadata;
    }
}
