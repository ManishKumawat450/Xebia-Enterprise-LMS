package com.xebia.userservice.service;

import com.xebia.userservice.model.Notification;
import com.xebia.userservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getAll() {
        return notificationRepository.findAll();
    }

    /**
     * Full-list upsert: rows with a known id are updated, new ids inserted,
     * and rows missing from the payload deleted. The frontend owns visibility
     * filtering (per recipientId), so it syncs its whole list here.
     */
    @Transactional
    public List<Notification> saveAll(List<Notification> incoming) {
        if (incoming == null) {
            incoming = List.of();
        }
        Set<String> incomingIds = incoming.stream()
                .map(Notification::getId)
                .collect(Collectors.toCollection(HashSet::new));

        List<Notification> toDelete = notificationRepository.findAll().stream()
                .filter(existing -> !incomingIds.contains(existing.getId()))
                .collect(Collectors.toList());
        if (!toDelete.isEmpty()) {
            notificationRepository.deleteAll(toDelete);
        }

        return notificationRepository.saveAll(incoming);
    }
}
