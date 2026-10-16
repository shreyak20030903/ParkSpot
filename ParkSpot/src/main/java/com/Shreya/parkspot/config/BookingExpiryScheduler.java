package com.Shreya.parkspot.config;

import com.Shreya.parkspot.Service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BookingExpiryScheduler {

    @Autowired
    private BookingService bookingService;

    // Every minute, free the bays of bookings whose time is over
    @Scheduled(fixedRate = 60_000)
    public void expire() {
        bookingService.expireOverdueBookings();
    }
}