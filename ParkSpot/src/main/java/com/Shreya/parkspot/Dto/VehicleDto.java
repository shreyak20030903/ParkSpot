package com.Shreya.parkspot.Dto;

import java.util.UUID;

/** parking is null when the vehicle is not parked. */
public record VehicleDto(UUID id, String type, String name, String number, ParkingInfoDto parking) {}
