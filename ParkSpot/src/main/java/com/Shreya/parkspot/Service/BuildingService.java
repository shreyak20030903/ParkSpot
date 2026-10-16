package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Dto.BuildingDto;
import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Repository.BuildingRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class BuildingService {

    @Autowired
    private BuildingRepository buildingRepo;
    @Autowired
    private SlotRepository slotRepo;

    public List<BuildingDto> getNearbyBuildings(double lat, double lng, double radiusKm) {
        List<BuildingDto> result = new ArrayList<>();
        for (Building b : buildingRepo.findAll()) {
            double d = haversine(lat, lng, b.getLatitude(), b.getLongitude());
            if (d <= radiusKm) {
                result.add(toDto(b, Math.round(d * 10.0) / 10.0));
            }
        }
        result.sort(Comparator.comparingDouble(BuildingDto::distanceKm));
        return result;
    }

    public List<BuildingDto> getBuildingsByCity(String city) {
        return buildingRepo.findByCity(city).stream().map(b -> toDto(b, null)).toList();
    }

    private BuildingDto toDto(Building b, Double distanceKm) {
        long free = slotRepo.countByFloor_Building_IdAndStatus(b.getId(), "free");
        long total = slotRepo.countByFloor_Building_Id(b.getId());
        return new BuildingDto(b.getId(), b.getName(), b.getCity(), b.getLatitude(), b.getLongitude(),
                distanceKm, free, total);
    }
    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}