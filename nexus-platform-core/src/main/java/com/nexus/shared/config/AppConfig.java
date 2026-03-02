package com.nexus.shared.config;

import com.nexus.auth.config.JwtAuthFilter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class AppConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @PostConstruct
    public void logConfig() {
        log.info("CORS allowed origins: {}", allowedOrigins);
    }

    /**
     * CORS config — credentials (cookies) require explicit origin, not wildcard.
     * allowCredentials(true) + allowedOrigins(specific) is mandatory for HTTP-only cookie flow.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);  // required for cookies to be sent cross-origin
        config.setMaxAge(3600L);           // browser caches preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Prevent Spring Boot from registering JwtAuthFilter as a servlet filter.
     * It's already added to the Spring Security chain in SecurityConfig.
     * Without this, the filter would run twice per request.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
