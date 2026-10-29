package com.Shreya.parkspot.Dto;

import java.util.List;
import java.util.UUID;

public record BuildingDetailDto(UUID id, String name, String city, String type, String imageUrl,
                                Double latitude, Double longitude, List<FloorInfoDto> floors) {}