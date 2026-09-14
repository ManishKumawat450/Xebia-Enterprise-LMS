package com.xebia.userservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    /**
     * Client-assigned id ("NOTIF-<ts>"): the frontend generates the id when the
     * notification is created locally, so server and client rows stay identical.
     */
    @Id
    private String id;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String type;

    /** Student UUID, "all_teachers", null (broadcast) or "system". */
    private String recipientId;

    private Boolean isRead;

    private String createdAt;
}
