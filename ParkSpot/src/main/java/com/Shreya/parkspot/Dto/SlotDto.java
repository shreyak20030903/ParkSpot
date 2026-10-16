package com.Shreya.parkspot.Dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SlotDto(UUID id, String slotCode, String vehicleType, String status,
                      LocalDateTime occupiedUntil) {}
