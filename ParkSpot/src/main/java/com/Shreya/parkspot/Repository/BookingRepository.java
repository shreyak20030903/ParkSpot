package com.Shreya.parkspot.Repository;

import com.Shreya.parkspot.Entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUser_IdAndStatus(UUID userId, String status);
    List<Booking> findByStatusAndSlot_Floor_Building_Id(String status, UUID buildingId);
    List<Booking> findByStatusAndEndTimeBefore(String status, LocalDateTime time);
}