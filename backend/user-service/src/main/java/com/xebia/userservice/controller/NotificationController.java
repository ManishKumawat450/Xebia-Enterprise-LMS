package com.xebia.userservice.controller;

import com.xebia.userservice.model.Notification;
import com.xebia.userservice.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<Notification> getAll() {
        return notificationService.getAll();
    }

    /** Full-list sync: upserts the provided notifications and removes missing ones. */
    @PostMapping("/sync")
    public List<Notification> sync(@RequestBody List<Notification> notifications) {
        return notificationService.saveAll(notifications);
    }
}
