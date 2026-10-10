package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Repository.BuildingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BuildingService {

    @Autowired
    private BuildingRepository buildingRepo;

    public List<Building> getNearbyBuildings(double lat, double lng, double radiusKm) {
        List<Building> all = buildingRepo.findAll();
        List<Building> nearby = new ArrayList<>();

        for (Building b : all) {
            double distance = haversine(lat, lng, b.getLatitude(), b.getLongitude());
            if (distance <= radiusKm) {
                nearby.add(b);
            }
        }

        nearby.sort((a, b) -> {
            double distA = haversine(lat, lng, a.getLatitude(), a.getLongitude());
            double distB = haversine(lat, lng, b.getLatitude(), b.getLongitude());
            return Double.compare(distA, distB);
        });

        return nearby;
    }

    public List<Building> getBuildingsByCity(String city) {
        return buildingRepo.findByCity(city);
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