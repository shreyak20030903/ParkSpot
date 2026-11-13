package com.Shreya.parkspot.Controller;

import com.Shreya.parkspot.Dto.BookingDto;
import com.Shreya.parkspot.Service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> book(@AuthenticationPrincipal UUID userId,
                                  @RequestParam UUID slotId,
                                  @RequestParam UUID vehicleId,
                                  @RequestParam int durationMinutes) {
        try {
            return ResponseEntity.ok(BookingDto.from(
                    bookingService.bookSlot(slotId, userId, vehicleId, durationMinutes)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // All of the user's parked vehicles. An empty list means nothing is parked.
    @GetMapping("/active")
    public List<BookingDto> active(@AuthenticationPrincipal UUID userId) {
        return bookingService.getActiveBookings(userId).stream().map(BookingDto::from).toList();
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
