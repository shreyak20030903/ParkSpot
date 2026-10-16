package com.Shreya.parkspot.Controller;
import com.Shreya.parkspot.Entity.User;
import com.Shreya.parkspot.Repository.UserRepository;
import com.Shreya.parkspot.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepo.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        userRepo.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        User user = userRepo.findByEmail(loginRequest.getEmail());
        if (user == null || !passwordEncoder.matches(loginRequest.getPasswordHash(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of("token", token, "name", user.getName(), "email", user.getEmail()));
    }
}