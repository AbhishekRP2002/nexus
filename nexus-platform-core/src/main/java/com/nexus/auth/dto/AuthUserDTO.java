package com.nexus.auth.dto;

import com.nexus.auth.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AuthUserDTO {

    private UUID id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private boolean twitterConnected;
    private OffsetDateTime createdAt;
    private OffsetDateTime lastLoginAt;

    // Static factory — keeps controller code clean: AuthUserDTO.from(user)
    public static AuthUserDTO from(User user) {
        return AuthUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .twitterConnected(user.isTwitterConnected())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
