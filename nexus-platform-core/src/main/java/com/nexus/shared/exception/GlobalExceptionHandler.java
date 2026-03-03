package com.nexus.shared.exception;

import com.nexus.shared.dto.APIResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // All business logic errors — thrown as NexusException(ErrorCode.X) in services
    @ExceptionHandler(NexusException.class)
    public ResponseEntity<APIResponse<Void>> handleNexusException(NexusException ex) {
        log.warn("Business error [{}}]: {}", ex.getErrorCode().getCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getErrorCode().getHttpStatus())
                .body(APIResponse.error(ex.getErrorCode().getCode(), ex.getMessage()));
    }

    // @Valid annotation failures on request bodies
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        log.warn("Validation failed: {}", message);
        return ResponseEntity
                .status(ErrorCode.VALIDATION_FAILED.getHttpStatus())
                .body(APIResponse.error(ErrorCode.VALIDATION_FAILED.getCode(), message));
    }

    // Spring Security 403 — authenticated but not allowed
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<APIResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(ErrorCode.FORBIDDEN.getHttpStatus())
                .body(APIResponse.error(ErrorCode.FORBIDDEN.getCode(), ErrorCode.FORBIDDEN.getDefaultMessage()));
    }

    // Catch-all — log full stack trace, return generic 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse<Void>> handleException(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getHttpStatus())
                .body(APIResponse.error(ErrorCode.INTERNAL_ERROR.getCode(), ErrorCode.INTERNAL_ERROR.getDefaultMessage()));
    }
}
