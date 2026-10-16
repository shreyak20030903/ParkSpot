package com.Shreya.parkspot.Repository;

import com.Shreya.parkspot.Entity.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long> {
    Optional<VehicleType> findByName(String name);
}
