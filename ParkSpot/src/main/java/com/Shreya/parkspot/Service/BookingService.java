package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Entity.User;
import com.Shreya.parkspot.Entity.VehicleType;
import com.Shreya.parkspot.Repository.BookingRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import com.Shreya.parkspot.Repository.VehicleTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    @Autowired
    private SlotRepository slotRepo;

    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private VehicleTypeRepository vehicleTypeRepo;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Transactional
    public Booking bookSlot(UUID slotId, UUID userId, Long vehicleTypeId, int durationMinutes) {
        String lockKey = "lock:slot:" + slotId;
        Boolean lockAcquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "locked", Duration.ofSeconds(5));

        if (Boolean.FALSE.equals(lockAcquired)) {
            throw new RuntimeException("Slot is currently being booked by someone else, try again");
        }

        try {
            // NAYA CHECK — user ka pehle se koi active booking toh nahi hai
            List<Booking> existingActive = bookingRepo.findByUser_IdAndStatus(userId, "active");
            if (!existingActive.isEmpty()) {
                throw new RuntimeException("You already have an active booking. End it before booking another slot.");
            }

            Slot slot = slotRepo.findById(slotId).orElseThrow();
            if (!slot.getStatus().equals("free")) {
                throw new RuntimeException("Slot already booked");
            }

            VehicleType vehicleType = vehicleTypeRepo.findById(vehicleTypeId).orElseThrow();

            slot.setStatus("booked");
            slotRepo.save(slot);

            Booking booking = new Booking();
            booking.setSlot(slot);
            User user = new User();
            user.setId(userId);
            booking.setUser(user);
            booking.setVehicleType(vehicleType);
            booking.setStartTime(LocalDateTime.now());
            booking.setEndTime(LocalDateTime.now().plusMinutes(durationMinutes));
            booking.setPrice(vehicleType.getPrice());
            booking.setStatus("active");

            return bookingRepo.save(booking);

        } finally {
            redisTemplate.delete(lockKey);
        }
    }
    public Booking getActiveBooking(UUID userId) {
        List<Booking> active = bookingRepo.findByUser_IdAndStatus(userId, "active");
        if (active.isEmpty()) {
            throw new RuntimeException("No active booking found");
        }
        return active.get(0);
    }

    public Booking endBooking(UUID bookingId) {
        Booking booking = bookingRepo.findById(bookingId).orElseThrow();
        booking.setStatus("completed");
        booking.setEndTime(LocalDateTime.now());
        bookingRepo.save(booking);

        Slot slot = booking.getSlot();
        slot.setStatus("free");
        slotRepo.save(slot);

        return booking;
    }


}