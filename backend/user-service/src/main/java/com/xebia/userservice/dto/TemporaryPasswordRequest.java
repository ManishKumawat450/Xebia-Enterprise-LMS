package com.xebia.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TemporaryPasswordRequest(@NotBlank @Size(min = 12, max = 72) String temporaryPassword) {}
