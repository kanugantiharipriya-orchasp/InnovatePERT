package com.innovatepert.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/api/**")
                        // Allow your default Vite development server origins
                        // Added 5174 and 5175 in case Vite increments the port during local testing
		                .allowedOrigins(
		                	    "http://localhost:5173",
		                	    "http://localhost:5174",
		                	    "http://localhost:5175",
		                	    "http://127.0.0.1:5173",
		                        "https://innovate-pert.vercel.app"
		                	)
                        // Allow all standard HTTP methods used by your frontend module
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        // Allow standard headers including Authorization for future JWT integration
                        .allowedHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
                        // Expose headers if your UI ever needs to read custom backend pagination/security tokens
                        .exposedHeaders("Authorization")
                        // Allow credentials (cookies, authorization headers)
                        .allowCredentials(true)
                        // Cache pre-flight (OPTIONS) request responses for 1 hour (3600 seconds) to reduce network overhead
                        .maxAge(3600);
            }
        };
    }
}