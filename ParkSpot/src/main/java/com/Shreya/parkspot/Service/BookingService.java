package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Entity.Vehicle;
import com.Shreya.parkspot.Entity.VehicleType;
import com.Shreya.parkspot.Repository.BookingRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import com.Shreya.parkspot.Repository.VehicleRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    @Autowired private SlotRepository slotRepo;
    @Autowired private BookingRepository bookingRepo;
    @Autowired private VehicleRepository vehicleRepo;
    @Autowired private VehicleTypeRepository vehicleTypeRepo;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private SlotBroadcaster broadcaster;
    @Autowired private TransactionTemplate txTemplate;
    @Autowired private PricingService pricing;

    public Booking bookSlot(UUID slotId, UUID userId, UUID vehicleId, int durationMinutes) {
        // One lock for the bay (two drivers, one bay) and one for the vehicle
        // (a double click must not park the same vehicle in two bays).
        String slotLock = "lock:slot:" + slotId;
        String vehicleLock = "lock:vehicle:" + vehicleId;

        if (!tryLock(slotLock)) {
            throw new RuntimeException("Someone else is booking this bay right now. Try again.");
        }
        if (!tryLock(vehicleLock)) {
            redisTemplate.delete(slotLock);
            throw new RuntimeException("A booking for this vehicle is already in progress.");
        }

        try {
            // The transaction commits here, inside the locks
            return txTemplate.execute(status -> createBooking(slotId, userId, vehicleId, durationMinutes));
        } finally {
            redisTemplate.delete(slotLock);
            redisTemplate.delete(vehicleLock);
        }
    }

    private boolean tryLock(String key) {
        return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(key, "locked", Duration.ofSeconds(5)));
    }

    private Booking createBooking(UUID slotId, UUID userId, UUID vehicleId, int durationMinutes) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        if (vehicle.isRemoved() || !vehicle.getUser().getId().equals(userId)) {
            throw new RuntimeException("This is not your vehicle");
        }

        // A user can have several vehicles parked, in different cities. Each vehicle only once.
        Optional<Booking> parked = bookingRepo.findFirstByVehicle_IdAndStatus(vehicleId, "active");
        if (parked.isPresent()) {
            String where = parked.get().getSlot().getFloor().getBuilding().getName();
            throw new RuntimeException(vehicle.getName() + " is already parked at " + where
                    + ". End that parking first, or choose another vehicle.");
        }

        Slot slot = slotRepo.findById(slotId).orElseThrow(() -> new RuntimeException("Bay not found"));
        if (!"free".equals(slot.getStatus())) {
            throw new RuntimeException("Bay already booked");
        }
        if (!vehicle.getType().equals(slot.getVehicleType())) {
            throw new RuntimeException("This bay is for " + slot.getVehicleType() + "s, but "
                    + vehicle.getName() + " is a " + vehicle.getType());
        }

        // The price comes from the building's type, the bay's vehicle type and the time asked
        // for. It is never taken from the client, and the time must be an allowed option.
        Building building = slot.getFloor().getBuilding();
        BigDecimal price = pricing.priceFor(building, slot.getVehicleType(), durationMinutes);

        VehicleType vehicleType = vehicleTypeRepo.findByName(slot.getVehicleType())
                .orElseThrow(() -> new RuntimeException("Vehicle type is not configured"));

        slot.setStatus("booked");
        slotRepo.save(slot);

        Booking booking = new Booking();
        booking.setUser(vehicle.getUser());
        booking.setVehicle(vehicle);
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

    /** Every vehicle of this user that is parked right now. */
    public List<Booking> getActiveBookings(UUID userId) {
        return bookingRepo.findByUser_IdAndStatus(userId, "active");
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
