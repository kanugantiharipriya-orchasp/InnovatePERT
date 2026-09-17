package com.innovatepert.security;

import java.io.IOException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.innovatepert.entity.User;
import com.innovatepert.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

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

        String token = authHeader.substring(7);
        System.out.println("JWT Token : " + token);

        try {

            String email = jwtService.extractEmail(token);
            System.out.println("Email From Token : " + email);

            if (email != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                Optional<User> optionalUser = userRepository.findByEmail(email);

                if (optionalUser.isEmpty()) {
                    System.out.println("User Not Found In Database");
                    filterChain.doFilter(request, response);
                    return;
                }

                User dbUser = optionalUser.get();

                System.out.println("Database User : " + dbUser.getEmail());
                System.out.println("Database Role : " + dbUser.getRole());

                UserDetails userDetails =
                        org.springframework.security.core.userdetails.User
                                .withUsername(dbUser.getEmail())
                                .password(dbUser.getPassword())
                                .authorities(dbUser.getRole().name())
                                .build();

                System.out.println("Authorities : " + userDetails.getAuthorities());

                if (jwtService.validateToken(token, email)) {

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);

                    System.out.println("Authentication SUCCESS");
                    System.out.println("Authentication Object : "
                            + SecurityContextHolder.getContext().getAuthentication());

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