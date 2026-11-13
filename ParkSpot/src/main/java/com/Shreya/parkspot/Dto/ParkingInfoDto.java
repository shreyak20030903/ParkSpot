package com.Shreya.parkspot.Dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** Where a vehicle is parked right now. */
public record ParkingInfoDto(UUID bookingId, UUID buildingId, String buildingName,
                             String slotCode, String floorLabel, LocalDateTime endTime) {}
