package com.xebia.userservice.service;

import com.xebia.userservice.model.User;
import com.xebia.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * Partial update: only non-null fields from the incoming payload are merged,
     * so callers can PATCH-like semantics over PUT without clobbering the rest.
     * id, role and the evaluation stats are intentionally not editable here.
     */
    public User updateUser(String id, User patch) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if (patch.getName() != null) existing.setName(patch.getName());
        if (patch.getEmail() != null) existing.setEmail(patch.getEmail());
        if (patch.getDepartment() != null) existing.setDepartment(patch.getDepartment());
        if (patch.getAvatar() != null) existing.setAvatar(patch.getAvatar());
        return userRepository.save(existing);
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public void deleteAllUsers() {
        userRepository.deleteAll();
    }

    public BulkResult createUsersBulk(List<User> users) {
        BulkResult result = new BulkResult();
        result.total = users.size();
        result.created = new ArrayList<>();
        result.failed = new ArrayList<>();

        for (User user : users) {
            try {
                User saved = userRepository.save(user);
                result.created.add(saved);
            } catch (Exception e) {
                result.failed.add(user.getName() != null ? user.getName() : "Unknown: " + e.getMessage());
            }
        }
        return result;
    }

    public static class BulkResult {
        public int total;
        public List<User> created;
        public List<String> failed;

        public int getTotal() { return total; }
        public int getSuccessCount() { return created.size(); }
        public int getFailCount() { return failed.size(); }
        public List<User> getCreated() { return created; }
        public List<String> getFailed() { return failed; }
    }
}
