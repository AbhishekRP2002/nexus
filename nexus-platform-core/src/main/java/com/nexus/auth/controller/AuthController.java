package com.nexus.auth.controller;

import com.nexus.auth.dto.AuthUserDTO;
import com.nexus.auth.entity.User;
import com.nexus.auth.repository.UserRepository;
import com.nexus.shared.dto.APIResponse;
import com.nexus.shared.exception.ErrorCode;
import com.nexus.shared.exception.NexusException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    /**
     * GET /api/auth/me
     * Returns the currently authenticated user's profile.
     * JwtAuthFilter sets authentication — if no valid cookie, authentication is null.
     */
    @GetMapping("/me")
    public ResponseEntity<APIResponse<AuthUserDTO>> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NexusException(ErrorCode.UNAUTHORIZED);
        }

        User user = (User) authentication.getPrincipal();
        log.debug("GET /me — user: {}", user.getEmail());

        return ResponseEntity.ok(APIResponse.ok(AuthUserDTO.from(user)));
    }

    /**
     * POST /api/auth/logout
     * Bumps token_version → invalidates all existing JWTs for this user.
     * Then clears the HTTP-only cookie.
     */
    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<APIResponse<Void>> logout(HttpServletResponse response,
                                                    Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            User principal = (User) authentication.getPrincipal();

            // Fetch fresh from DB to avoid stale detached entity
            userRepository.findById(principal.getId()).ifPresent(user -> {
                user.setTokenVersion(user.getTokenVersion() + 1);
                userRepository.save(user);
                log.info("User logged out — token version bumped: {}", user.getEmail());
            });
        }

        // Clear the cookie regardless of auth state
        ResponseCookie cookie = ResponseCookie.from("nexus_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(APIResponse.ok());
    }
}
