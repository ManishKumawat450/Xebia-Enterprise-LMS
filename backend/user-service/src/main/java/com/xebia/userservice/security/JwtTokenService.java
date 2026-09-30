package com.xebia.userservice.security;

import com.xebia.userservice.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtTokenService {
    private final String issuer;
    private final long tokenMinutes;
    private final SecretKey signingKey;

    public JwtTokenService(
            @Value("${lms.jwt.secret:}") String secret,
            @Value("${lms.jwt.issuer:enterprise-lms}") String issuer,
            @Value("${lms.jwt.access-token-minutes:30}") long tokenMinutes) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32 || secret.startsWith("replace-with")) {
            throw new IllegalStateException("JWT_SECRET must be configured with at least 32 random bytes");
        }
        if (tokenMinutes < 1 || tokenMinutes > 120) {
            throw new IllegalStateException("JWT_ACCESS_TOKEN_MINUTES must be between 1 and 120");
        }
        this.issuer = issuer;
        this.tokenMinutes = tokenMinutes;
        this.signingKey = Keys.hmacShaKeyFor(bytes);
    }

    public String issue(User user) {
        Instant now = Instant.now();
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase();
        return Jwts.builder()
                .issuer(issuer)
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("role", role)
                .claim("roles", List.of(role))
                .claim("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(tokenMinutes * 60)))
                .signWith(signingKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long expiresInSeconds() {
        return tokenMinutes * 60;
    }
}
