package com.xebia.userservice.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xebia.userservice.security.JwtTokenService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "openai/gpt-oss-120b";
    private static final int MAX_MESSAGES = 20;
    private static final int MAX_CONTENT_LENGTH = 800;
    private static final String SYSTEM_PROMPT =
            "You are a helpful study assistant for Xebia LMS, an enterprise learning platform. " +
            "Help students with programming and technology concepts, how to use the LMS " +
            "(courses, assessments, results, batches), study tips, and practice questions. " +
            "Be concise, friendly, and educational. Keep answers under 200 words unless " +
            "more detail is explicitly requested. Respond in plain text, no markdown formatting. " +
            "Do not make up specific information about any student's grades or progress.";

    private final JwtTokenService jwtTokenService;
    private final String groqApiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatController(JwtTokenService jwtTokenService,
                          @Value("${groq.api.key:}") String groqApiKey) {
        this.jwtTokenService = jwtTokenService;
        this.groqApiKey = groqApiKey;
    }

    public record ChatMessage(String role, String content) {}
    public record ChatRequest(List<ChatMessage> messages) {}

    @PostMapping
    public Map<String, String> chat(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ChatRequest request) {

        Claims claims = requireToken(authorization);
        String role = claims.get("role", String.class);
        if (!"STUDENT".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student access only");
        }
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chat service is not configured on this server");
        }

        List<ChatMessage> messages = request.messages();
        if (messages == null || messages.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No messages provided");
        }
        if (messages.size() > MAX_MESSAGES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many messages in context (max " + MAX_MESSAGES + ")");
        }
        for (ChatMessage msg : messages) {
            if (!"user".equals(msg.role()) && !"assistant".equals(msg.role())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid message role. Only user and assistant are allowed.");
            }
            if (msg.content() == null || msg.content().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content must not be blank");
            }
            if (msg.content().length() > MAX_CONTENT_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message too long (max " + MAX_CONTENT_LENGTH + " characters)");
            }
        }

        List<Map<String, String>> groqMessages = new ArrayList<>();
        groqMessages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        for (ChatMessage msg : messages) {
            groqMessages.add(Map.of("role", msg.role(), "content", msg.content()));
        }

        String reply = callGroq(groqMessages);
        return Map.of("reply", reply);
    }

    private String callGroq(List<Map<String, String>> messages) {
        try {
            Map<String, Object> body = Map.of(
                    "model", GROQ_MODEL,
                    "messages", messages,
                    "temperature", 0.7,
                    "max_tokens", 512
            );
            String requestBody = objectMapper.writeValueAsString(body);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI rate limit reached, please try again later");
            }
            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service returned error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String reply = root.path("choices").path(0).path("message").path("content").asText();
            if (reply.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty reply from AI service");
            }
            return reply;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to reach AI service: " + e.getMessage());
        }
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
