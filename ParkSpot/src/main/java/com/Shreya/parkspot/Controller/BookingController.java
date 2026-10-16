package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.BookingDto;
import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> book(@AuthenticationPrincipal UUID userId,
                                  @RequestParam UUID slotId,
                                  @RequestParam(defaultValue = "120") int durationMinutes) {
        try {
            return ResponseEntity.ok(BookingDto.from(bookingService.bookSlot(slotId, userId, durationMinutes)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive(@AuthenticationPrincipal UUID userId) {
        try {
            return ResponseEntity.ok(BookingDto.from(bookingService.getActiveBooking(userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{bookingId}/end")
    public ResponseEntity<?> end(@AuthenticationPrincipal UUID userId, @PathVariable UUID bookingId) {
        try {
            return ResponseEntity.ok(BookingDto.from(bookingService.endBooking(bookingId, userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}