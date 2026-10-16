package com.Shreya.parkspot.Dto;

import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Entity.Floor;
import com.Shreya.parkspot.Entity.Slot;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BookingDto(UUID id, UUID slotId, String slotCode, String vehicleType, String floorLabel,
                         UUID buildingId, String buildingName, LocalDateTime startTime,
                         LocalDateTime endTime, BigDecimal price, String status) {

    public static BookingDto from(Booking b) {
        Slot s = b.getSlot();
        Floor f = s.getFloor();
        Building bd = f.getBuilding();
        return new BookingDto(b.getId(), s.getId(), s.getSlotCode(), s.getVehicleType(), f.getLabel(),
                bd.getId(), bd.getName(), b.getStartTime(), b.getEndTime(), b.getPrice(), b.getStatus());
    }
}
