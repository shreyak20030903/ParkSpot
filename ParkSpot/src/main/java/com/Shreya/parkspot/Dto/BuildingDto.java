package com.Shreya.parkspot.Dto;

import java.util.UUID;

public record BuildingDto(UUID id, String name, String city, Double latitude, Double longitude,
                          Double distanceKm, long freeSlots, long totalSlots) {}
