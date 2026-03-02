package com.nexus.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ── Auth ──────────────────────────────────────────────────
    UNAUTHORIZED("AUTH_001", "Authentication required", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN("AUTH_002", "Invalid or expired token", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("AUTH_003", "Access denied", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND("AUTH_004", "User not found", HttpStatus.NOT_FOUND),

    // ── Validation ────────────────────────────────────────────
    VALIDATION_FAILED("VAL_001", "Request validation failed", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST("VAL_002", "Invalid request", HttpStatus.BAD_REQUEST),

    // ── System ────────────────────────────────────────────────
    INTERNAL_ERROR("SYS_001", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR),
    NOT_FOUND("SYS_002", "Resource not found", HttpStatus.NOT_FOUND);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }
}
