package com.innovatepert.security;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // ==============================
    // Generate JWT Token (With Role)
    // ==============================

    // Overloaded method to generate token with role claim
    public String generateToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, email);
    }

    // Default method (compatibility)
    public String generateToken(String email) {
        return createToken(new HashMap<>(), email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ==============================
    // Extract Email from Token
    // ==============================

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // ==============================
    // Extract Role from Token (NEW)
    // ==============================

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    // ==============================
    // Extract Expiration Date
    // ==============================

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // ==============================
    // Extract Any Claim
    // ==============================

    public <T> T extractClaim(String token,
                              Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // ==============================
    // Extract All Claims
    // ==============================

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ==============================
    // Check Token Expired
    // ==============================

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ==============================
    // Validate Token
    // ==============================

    public boolean validateToken(String token, String email) {
        String extractedEmail = extractEmail(token);
        return extractedEmail.equals(email) && !isTokenExpired(token);
    }
}