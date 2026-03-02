package com.nexus.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class APIResponse<T> {

    private final boolean success;
    private final T data;
    private final String error;
    private final String message;

    private APIResponse(boolean success, T data, String error, String message) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.message = message;
    }

    // ── Success responses ─────────────────────────────────────

    // GET /api/auth/me → APIResponse.ok(userDTO)
    public static <T> APIResponse<T> ok(T data) {
        return new APIResponse<>(true, data, null, null);
    }

    // APIResponse.ok(userDTO, "Login successful")
    public static <T> APIResponse<T> ok(T data, String message) {
        return new APIResponse<>(true, data, null, message);
    }

    // POST /api/auth/logout → APIResponse.ok()  (no data to return)
    public static APIResponse<Void> ok() {
        return new APIResponse<>(true, null, null, null);
    }

    // ── Error responses ───────────────────────────────────────

    // APIResponse.error("AUTH_001", "Authentication required")
    public static <T> APIResponse<T> error(String errorCode, String message) {
        return new APIResponse<>(false, null, errorCode, message);
    }
}
