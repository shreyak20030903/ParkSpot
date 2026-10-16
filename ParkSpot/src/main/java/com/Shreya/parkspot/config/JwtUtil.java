package com.Shreya.parkspot.config;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
@Component
public class JwtUtil {

    private final SecretKey key;
    private static final long EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String email) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        return UUID.fromString(claims.getSubject());
    }
}