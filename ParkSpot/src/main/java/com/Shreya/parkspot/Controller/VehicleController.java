package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.VehicleDto;
import com.Shreya.parkspot.Dto.VehicleRequest;
import com.Shreya.parkspot.Service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    // The user's vehicles, each with where it is parked (or null)
    @GetMapping
    public List<VehicleDto> list(@AuthenticationPrincipal UUID userId) {
        return vehicleService.list(userId);
    }

    @PostMapping
    public ResponseEntity<?> add(@AuthenticationPrincipal UUID userId, @RequestBody VehicleRequest request) {
        try {
            return ResponseEntity.ok(vehicleService.add(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            vehicleService.remove(userId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
