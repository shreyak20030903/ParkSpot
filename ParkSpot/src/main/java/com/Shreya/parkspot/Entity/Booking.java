package com.Shreya.parkspot.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
    private String status;        // "active", "completed", "cancelled"

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "slot_id")

    private Slot slot;

    @ManyToOne
    @JoinColumn(name = "vehicle_type_id")
    @JsonIgnore
    private VehicleType vehicleType;

    // getters and setters
}