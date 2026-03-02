package com.nexus.auth.config;

import com.nexus.auth.entity.User;
import com.nexus.auth.service.GoogleOAuthService;
import com.nexus.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import java.time.Duration;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final GoogleOAuthService googleOAuthService;
    private final JwtService jwtService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())             // JWT + cookies handle CSRF via SameSite=Lax
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // OAuth2 flow + our auth endpoints + Swagger docs
                .requestMatchers(
                    "/login/**", "/oauth2/**",
                    "/api/auth/**",
                    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler())
                .failureHandler((req, res, ex) -> {
                    res.sendRedirect(frontendUrl + "/login?error=oauth_failed");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler oAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            // 1. Find or create user in DB
            User user = googleOAuthService.findOrCreateUser(oAuth2User);

            // 2. Issue JWT
            String token = jwtService.generateToken(user);

            // 3. Set HTTP-only cookie — JS cannot read this
            ResponseCookie cookie = ResponseCookie.from("nexus_token", token)
                    .httpOnly(true)
                    .secure(request.isSecure())   // true on HTTPS (prod), false on HTTP (local)
                    .path("/")
                    .maxAge(Duration.ofMillis(jwtService.getExpirationMs()))
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            // 4. Redirect to feed
            response.sendRedirect(frontendUrl + "/feed");
        };
    }
}
