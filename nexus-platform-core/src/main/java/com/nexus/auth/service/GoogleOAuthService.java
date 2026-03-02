package com.nexus.auth.service;

import com.nexus.auth.entity.User;
import com.nexus.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final UserRepository userRepository;

    /**
     * Called from the OAuth2 success handler after Google authenticates the user.
     * Finds the existing user or creates a new one — never throws, always returns a User.
     */
    @Transactional
    public User findOrCreateUser(OAuth2User oAuth2User) {
        String googleId = oAuth2User.getAttribute("sub");        // Google's unique user ID
        String email = oAuth2User.getAttribute("email");
        String displayName = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");

        return userRepository.findByGoogleId(googleId)
                .map(existing -> refreshProfile(existing, displayName, avatarUrl))
                .orElseGet(() -> createUser(googleId, email, displayName, avatarUrl));
    }

    // Existing user — update name/avatar (Google profile might change) and record login
    private User refreshProfile(User user, String displayName, String avatarUrl) {
        log.debug("Existing user login: {}", user.getEmail());
        user.setDisplayName(displayName);
        user.setAvatarUrl(avatarUrl);
        user.setLastLoginAt(OffsetDateTime.now());
        return userRepository.save(user);
    }

    // New user — first time logging in via Google
    private User createUser(String googleId, String email, String displayName, String avatarUrl) {
        log.info("New user created: {}", email);
        User user = User.builder()
                .googleId(googleId)
                .email(email)
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .lastLoginAt(OffsetDateTime.now())
                .build();
        return userRepository.save(user);
    }
}
