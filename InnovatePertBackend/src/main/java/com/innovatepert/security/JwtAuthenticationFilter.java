package com.innovatepert.security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("\n========== JWT FILTER ==========");
        System.out.println("Request URI : " + request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        System.out.println("Authorization Header : " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Bearer Token Missing");
            filterChain.doFilter(request, response);
            return;
        }

        // Extract Token
        String token = authHeader.substring(7);

        try {
            // Extract Email & Role from Token
            String email = jwtService.extractEmail(token);
            String role = jwtService.extractRole(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Clean role string and ensure standard handling
                String cleanRole = (role != null) ? role.trim().toUpperCase().replace("ROLE_", "") : "USER";

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority(cleanRole),         // e.g., "MANAGER"
                        new SimpleGrantedAuthority("ROLE_" + cleanRole)  // e.g., "ROLE_MANAGER"
                );

                // Create UserDetails with Dynamic Authorities using Spring Security User class
                UserDetails userDetails = User.withUsername(email)
                        .password("")
                        .authorities(authorities)
                        .build();

                // Token Validation
                if (jwtService.validateToken(token, email)) {
                    System.out.println("Token Valid");

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    authorities);

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // Set Security Context
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println("✅ JWT SUCCESS: Authenticated User [" + email + "] with Role [" + cleanRole + "]");
                } else {
                    System.out.println("Token Validation FAILED");
                }
            }

        } catch (Exception e) {
            System.out.println("JWT ERROR : " + e.getMessage());
            e.printStackTrace();
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}