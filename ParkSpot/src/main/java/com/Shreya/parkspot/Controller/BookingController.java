package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> book(
            @RequestParam UUID slotId,
            @RequestParam UUID userId,
            @RequestParam Long vehicleTypeId,
            @RequestParam(defaultValue = "120") int durationMinutes) {
        try {
            Booking booking = bookingService.bookSlot(slotId, userId, vehicleTypeId, durationMinutes);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive(@RequestParam UUID userId) {
        try {
            Booking booking = bookingService.getActiveBooking(userId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{bookingId}/end")
    public ResponseEntity<?> end(@PathVariable UUID bookingId) {
        Booking booking = bookingService.endBooking(bookingId);
        return ResponseEntity.ok(booking);
    }
}