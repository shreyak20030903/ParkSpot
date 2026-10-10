package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buildings")
public class SlotController {

    @Autowired
    private SlotRepository slotRepo;

    @GetMapping("/{buildingId}/slots")
    public List<Slot> getSlots(
            @PathVariable UUID buildingId,
            @RequestParam String vehicleType) {
        return slotRepo.findByFloor_Building_IdAndVehicleType(buildingId, vehicleType);
    }
}