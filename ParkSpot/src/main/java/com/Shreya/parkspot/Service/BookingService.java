package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Entity.User;
import com.Shreya.parkspot.Entity.VehicleType;
import com.Shreya.parkspot.Repository.BookingRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import com.Shreya.parkspot.Repository.UserRepository;
import com.Shreya.parkspot.Repository.VehicleTypeRepository;
import com.Shreya.parkspot.config.SlotBroadcaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    @Autowired private SlotRepository slotRepo;
    @Autowired private BookingRepository bookingRepo;
    @Autowired private VehicleTypeRepository vehicleTypeRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private SlotBroadcaster broadcaster;
    @Autowired private TransactionTemplate txTemplate;
    @Autowired private PricingService pricing;

    public Booking bookSlot(UUID slotId, UUID userId, int durationMinutes) {
        String lockKey = "lock:slot:" + slotId;
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(5));
        if (Boolean.FALSE.equals(locked)) {
            throw new RuntimeException("Someone else is booking this bay right now. Try again.");
        }

        try {
            // The transaction commits here, inside the lock
            return txTemplate.execute(status -> createBooking(slotId, userId, durationMinutes));
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    private Booking createBooking(UUID slotId, UUID userId, int durationMinutes) {
        if (!bookingRepo.findByUser_IdAndStatus(userId, "active").isEmpty()) {
            throw new RuntimeException("You already have an active booking. End it before booking another bay.");
        }

        Slot slot = slotRepo.findById(slotId).orElseThrow(() -> new RuntimeException("Bay not found"));
        if (!"free".equals(slot.getStatus())) {
            throw new RuntimeException("Bay already booked");
        }

        // The price comes from the building's type, the bay's vehicle type and the time
        // asked for. It is never taken from the client, and the time must be an allowed option.
        Building building = slot.getFloor().getBuilding();
        BigDecimal price = pricing.priceFor(building, slot.getVehicleType(), durationMinutes);

        VehicleType vehicleType = vehicleTypeRepo.findByName(slot.getVehicleType())
                .orElseThrow(() -> new RuntimeException("Vehicle type is not configured"));
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        slot.setStatus("booked");
        slotRepo.save(slot);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setSlot(slot);
        booking.setVehicleType(vehicleType);
        booking.setStartTime(LocalDateTime.now());
        booking.setEndTime(LocalDateTime.now().plusMinutes(durationMinutes));
        booking.setPrice(price);
        booking.setStatus("active");
        Booking saved = bookingRepo.save(booking);

        broadcaster.buildingChanged(building.getId());
        return saved;
    }

    public Booking getActiveBooking(UUID userId) {
        List<Booking> active = bookingRepo.findByUser_IdAndStatus(userId, "active");
        if (active.isEmpty()) {
            throw new RuntimeException("No active booking found");
        }
        return active.get(0);
    }

    @Transactional
    public Booking endBooking(UUID bookingId, UUID userId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not your booking");
        }
        if (!"active".equals(booking.getStatus())) {
            throw new RuntimeException("Booking already ended");
        }
        finish(booking, true);
        return booking;
    }

    @Transactional
    public void expireOverdueBookings() {
        List<Booking> overdue = bookingRepo.findByStatusAndEndTimeBefore("active", LocalDateTime.now());
        for (Booking booking : overdue) {
            finish(booking, false);
        }
    }

    private void finish(Booking booking, boolean endedEarly) {
        booking.setStatus("completed");
        if (endedEarly) {
            booking.setEndTime(LocalDateTime.now());
        }
        bookingRepo.save(booking);

        Slot slot = booking.getSlot();
        slot.setStatus("free");
        slotRepo.save(slot);

        broadcaster.buildingChanged(slot.getFloor().getBuilding().getId());
    }
}