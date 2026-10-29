package com.Shreya.parkspot.Dto;

import java.util.UUID;

public record BuildingDto(UUID id, String name, String city, String type, String imageUrl,
                          Double latitude, Double longitude, Double distanceKm,
                          long freeSlots, long totalSlots, int carPerHour, int bikePerHour) {}