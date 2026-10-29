package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.BuildingDto;
import com.Shreya.parkspot.Service.BuildingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buildings")
public class BuildingController {

    @Autowired
    private BuildingService buildingService;

    @GetMapping("/nearby")
    public List<BuildingDto> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "4") double radiusKm) {
        return buildingService.getNearbyBuildings(lat, lng, radiusKm);
    }

    @GetMapping
    public List<BuildingDto> getByCity(@RequestParam String city) {
        return buildingService.getBuildingsByCity(city);
    }

    // One building: type, photo, and which floor serves which vehicle
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(buildingService.getBuildingDetail(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // Parking time options with their prices, for the payment step
    @GetMapping("/{id}/pricing")
    public ResponseEntity<?> pricing(@PathVariable UUID id, @RequestParam String vehicleType) {
        try {
            return ResponseEntity.ok(buildingService.getPricing(id, vehicleType));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}