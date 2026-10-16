package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.SlotDto;
import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Repository.BookingRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/buildings")
public class SlotController {

    @Autowired
    private SlotRepository slotRepo;

    @Autowired
    private BookingRepository bookingRepo;

    @GetMapping("/{buildingId}/slots")
    public List<SlotDto> getSlots(@PathVariable UUID buildingId, @RequestParam String vehicleType) {
        List<Slot> slots = slotRepo.findByFloor_Building_IdAndVehicleType(buildingId, vehicleType);

        // When each taken bay frees up (end time only, not who booked it)
        Map<UUID, LocalDateTime> occupiedUntil = new HashMap<>();
        for (Booking b : bookingRepo.findByStatusAndSlot_Floor_Building_Id("active", buildingId)) {
            occupiedUntil.put(b.getSlot().getId(), b.getEndTime());
        }

        return slots.stream()
                .map(s -> new SlotDto(s.getId(), s.getSlotCode(), s.getVehicleType(), s.getStatus(),
                        occupiedUntil.get(s.getId())))
                .toList();
    }
}