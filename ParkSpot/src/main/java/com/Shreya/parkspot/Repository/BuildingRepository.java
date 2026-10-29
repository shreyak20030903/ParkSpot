package com.Shreya.parkspot.Repository;

import com.Shreya.parkspot.Entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuildingRepository extends JpaRepository<Building, UUID> {
    List<Building> findByCity(String city);
    boolean existsByName(String name);
}

