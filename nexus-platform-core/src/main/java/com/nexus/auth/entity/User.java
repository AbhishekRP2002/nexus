package com.nexus.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "twitterTokens")  // never log encrypted tokens
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    private String displayName;

    private String avatarUrl;

    @Column(nullable = false, unique = true)
    private String googleId;

    // Twitter — Phase 2
    @Column(nullable = false)
    @Builder.Default
    private boolean twitterConnected = false;

    private String twitterTokens;  // AES-256/GCM encrypted JSON blob

    // Bump this on logout → all existing JWTs instantly invalidated
    @Column(nullable = false)
    @Builder.Default
    private int tokenVersion = 0;

    // Soft disable — never delete users
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    private OffsetDateTime lastLoginAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> preferences = new HashMap<>();
}
