package com.nexus.shared.exception;

import lombok.Getter;

@Getter
public class NexusException extends RuntimeException {

    private final ErrorCode errorCode;

    // Use error code's default message
    // throw new NexusException(ErrorCode.USER_NOT_FOUND)
    public NexusException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    // Override with a custom message for more context
    // throw new NexusException(ErrorCode.USER_NOT_FOUND, "No user for googleId: " + id)
    public NexusException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }

    // Wrap a caught exception — preserves the original stack trace
    // throw new NexusException(ErrorCode.INTERNAL_ERROR, e)
    public NexusException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }
}
