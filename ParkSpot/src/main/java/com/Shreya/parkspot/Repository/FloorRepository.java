package com.Shreya.parkspot.Repository;

import com.Shreya.parkspot.Entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FloorRepository extends JpaRepository<Floor, UUID> {}
