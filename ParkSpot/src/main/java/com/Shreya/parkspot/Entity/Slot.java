package com.Shreya.parkspot.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
public class Slot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String slotCode;      // "A1", "B7"
    private String vehicleType;   // "bike" or "car"
    private String status;        // "free", "held", "booked"

    @ManyToOne
    @JoinColumn(name = "floor_id")
    @JsonIgnore
    private Floor floor;

}