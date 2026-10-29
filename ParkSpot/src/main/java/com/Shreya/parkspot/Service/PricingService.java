package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Dto.PricingOptionDto;
import com.Shreya.parkspot.Entity.Building;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Parking prices. The server is the only place that calculates a price:
 * the frontend shows these options and sends back only the number of minutes.
 */
@Service
public class PricingService {

    // hourly: per hour for stays shorter than a day
    // daily:  per day, and also the cap for stays shorter than a day
    // monthly: flat price for a 30 day stay (0 means there is no monthly plan)
    private record Rate(int hourly, int daily, int monthly) {}

    private static final Map<String, Map<String, Rate>> RATES = Map.of(
            "mall", Map.of(
                    "car", new Rate(40, 300, 0),
                    "bike", new Rate(20, 150, 0)),
            "airport", Map.of(
                    "car", new Rate(30, 250, 3500),
                    "bike", new Rate(15, 80, 1200)),
            "railway", Map.of(
                    "car", new Rate(20, 150, 2500),
                    "bike", new Rate(10, 50, 800)));

    // Malls: short stays. Airports and stations: people leave the vehicle and travel.
    private static final List<Integer> MALL_MINUTES = List.of(60, 120, 180, 240, 360, 480);
    private static final List<Integer> LONG_STAY_MINUTES =
            List.of(360, 720, 1440, 2880, 5760, 10080, 21600, 43200);

    private static final int DAY = 1440;
    private static final int MONTH = 43200;

    /** Buildings saved before the "type" column existed count as malls. */
    public static String typeOf(Building b) {
        String t = b.getType();
        return (t == null || !RATES.containsKey(t)) ? "mall" : t;
    }

    public int hourlyRate(Building b, String vehicleType) {
        return rate(b, vehicleType).hourly();
    }

    public List<PricingOptionDto> optionsFor(Building b, String vehicleType) {
        Rate rate = rate(b, vehicleType);
        List<PricingOptionDto> options = new ArrayList<>();
        for (int minutes : allowedMinutes(b)) {
            options.add(new PricingOptionDto(label(minutes), minutes,
                    BigDecimal.valueOf(compute(rate, minutes))));
        }
        return options;
    }

    public BigDecimal priceFor(Building b, String vehicleType, int minutes) {
        if (!allowedMinutes(b).contains(minutes)) {
            throw new RuntimeException("This parking time is not available for this building");
        }
        return BigDecimal.valueOf(compute(rate(b, vehicleType), minutes));
    }

    private List<Integer> allowedMinutes(Building b) {
        return typeOf(b).equals("mall") ? MALL_MINUTES : LONG_STAY_MINUTES;
    }

    private Rate rate(Building b, String vehicleType) {
        Rate rate = RATES.get(typeOf(b)).get(vehicleType);
        if (rate == null) {
            throw new RuntimeException("Unknown vehicle type");
        }
        return rate;
    }

    private int compute(Rate r, int minutes) {
        if (minutes < DAY) {
            int hours = (int) Math.ceil(minutes / 60.0);
            return Math.min(hours * r.hourly(), r.daily());
        }
        if (minutes == MONTH && r.monthly() > 0) {
            return r.monthly();
        }
        int days = (int) Math.ceil(minutes / (double) DAY);
        return (int) Math.round(days * r.daily() * longStayFactor(days));
    }

    // Longer stays get a discount, so 15 days never costs more than a month
    private static double longStayFactor(int days) {
        if (days >= 15) return 0.65;
        if (days >= 7) return 0.80;
        return 1.0;
    }

    private static String label(int minutes) {
        if (minutes == MONTH) return "1 month";
        if (minutes % DAY == 0) {
            int d = minutes / DAY;
            return d + (d == 1 ? " day" : " days");
        }
        int h = minutes / 60;
        return h + (h == 1 ? " hour" : " hours");
    }
}