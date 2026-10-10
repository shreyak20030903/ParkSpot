package com.Shreya.parkspot.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
public class Floor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String label;       // "B1", "B2"
    private Integer totalSlots;

    @ManyToOne
    @JoinColumn(name = "building_id")
    @JsonIgnore
    private Building building;

    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL)
    private List<Slot> slots;

    // getters and setters
}
