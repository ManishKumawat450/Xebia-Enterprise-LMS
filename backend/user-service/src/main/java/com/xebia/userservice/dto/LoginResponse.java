package com.xebia.userservice.dto;

import com.xebia.userservice.model.User;

public record LoginResponse(
        String token,
        String id,
        String name,
        String email,
        String role,
        boolean mustChangePassword,
        long expiresInSeconds) {

    public static LoginResponse from(String token, long expiresInSeconds, User user) {
        return new LoginResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(),
                Boolean.TRUE.equals(user.getMustChangePassword()), expiresInSeconds);
    }
}
