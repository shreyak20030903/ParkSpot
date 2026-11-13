package com.Shreya.parkspot.Repository;

import com.Shreya.parkspot.Entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findByUser_IdAndRemovedFalseOrderByNameAsc(UUID userId);

    boolean existsByUser_IdAndNumberAndRemovedFalse(UUID userId, String number);
}
