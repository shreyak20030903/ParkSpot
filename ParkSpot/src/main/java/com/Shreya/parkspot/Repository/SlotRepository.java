package com.Shreya.parkspot.Repository;


import com.Shreya.parkspot.Entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SlotRepository extends JpaRepository<Slot, UUID> {
    List<Slot> findByFloor_Building_IdAndVehicleType(UUID buildingId, String vehicleType);
    List<Slot> findByFloor_IdAndVehicleType(UUID floorId, String vehicleType);

    long countByFloor_Building_IdAndStatus(UUID buildingId, String status);
    long countByFloor_Building_Id(UUID buildingId);
}
