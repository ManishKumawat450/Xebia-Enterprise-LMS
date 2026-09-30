package com.xebia.userservice.controller;

import com.xebia.userservice.dto.LoginRequest;
import com.xebia.userservice.dto.LoginResponse;
import com.xebia.userservice.dto.PasswordChangeRequest;
import com.xebia.userservice.dto.TemporaryPasswordRequest;
import com.xebia.userservice.security.JwtTokenService;
import com.xebia.userservice.service.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtTokenService jwtTokenService;

    public AuthController(AuthService authService, JwtTokenService jwtTokenService) {
        this.authService = authService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody PasswordChangeRequest request) {
        Claims claims = requireToken(authorization);
        authService.changePassword(claims.getSubject(), request.currentPassword(), request.newPassword());
        return Map.of("message", "Password changed. Please sign in again.");
    }

    @PostMapping("/admin/users/{userId}/temporary-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setTemporaryPassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String userId,
            @Valid @RequestBody TemporaryPasswordRequest request) {
        Claims claims = requireToken(authorization);
        String role = claims.get("role", String.class);
        boolean mustChange = Boolean.TRUE.equals(claims.get("mustChangePassword", Boolean.class));
        if (!"ADMIN".equalsIgnoreCase(role) || mustChange) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin authorization required");
        }
        authService.setTemporaryPassword(userId, request.temporaryPassword());
    }

    private Claims requireToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() <= 7) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token required");
        }
        try {
            return jwtTokenService.parse(authorization.substring(7).trim());
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired access token");
        }
    }
}
