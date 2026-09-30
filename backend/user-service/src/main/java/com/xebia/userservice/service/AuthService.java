package com.xebia.userservice.service;

import com.xebia.userservice.dto.LoginResponse;
import com.xebia.userservice.model.User;
import com.xebia.userservice.repository.UserRepository;
import com.xebia.userservice.security.JwtTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public LoginResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmailIgnoreCase(email == null ? "" : email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (user.getRole() == null || user.getRole().isBlank() || rawPassword == null
                || rawPassword.getBytes(StandardCharsets.UTF_8).length > 72
                || user.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return LoginResponse.from(jwtTokenService.issue(user), jwtTokenService.expiresInSeconds(), user);
    }

    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        validatePassword(newPassword);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must differ from the current password");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    @Transactional
    public void setTemporaryPassword(String userId, String temporaryPassword) {
        validatePassword(temporaryPassword);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);
    }

    private void validatePassword(String password) {
        int byteLength = password == null ? 0 : password.getBytes(StandardCharsets.UTF_8).length;
        if (password == null || password.length() < 12 || password.length() > 72 || byteLength > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be 12-72 characters and no more than 72 UTF-8 bytes");
        }
    }
}
