package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.BuildingDto;
import com.Shreya.parkspot.Service.BuildingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}