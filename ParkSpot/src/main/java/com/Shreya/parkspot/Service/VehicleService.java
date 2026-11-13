package com.Shreya.parkspot.Service;

import com.Shreya.parkspot.Dto.ParkingInfoDto;
import com.Shreya.parkspot.Dto.VehicleDto;
import com.Shreya.parkspot.Dto.VehicleRequest;
import com.Shreya.parkspot.Entity.Booking;
import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Entity.Floor;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Entity.User;
import com.Shreya.parkspot.Entity.Vehicle;
import com.Shreya.parkspot.Repository.BookingRepository;
import com.Shreya.parkspot.Repository.UserRepository;
import com.Shreya.parkspot.Repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VehicleService {

    @Autowired private VehicleRepository vehicleRepo;
    @Autowired private BookingRepository bookingRepo;
    @Autowired private UserRepository userRepo;

    public List<VehicleDto> list(UUID userId) {
        List<VehicleDto> result = new ArrayList<>();
        for (Vehicle v : vehicleRepo.findByUser_IdAndRemovedFalseOrderByNameAsc(userId)) {
            result.add(toDto(v));
        }
        return result;
    }

    public VehicleDto add(UUID userId, VehicleRequest request) {
        String type = request.type() == null ? "" : request.type().trim().toLowerCase();
        if (!type.equals("car") && !type.equals("bike")) {
            throw new RuntimeException("The vehicle must be a car or a bike");
        }

        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty() || name.length() > 40) {
            throw new RuntimeException("Enter a name for the vehicle, up to 40 characters");
        }

        // MP09 AB 1234, mp-09-ab-1234 and MP09AB1234 are the same number
        String number = request.number() == null ? ""
                : request.number().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (!number.matches("[A-Z0-9]{6,12}")) {
            throw new RuntimeException("Enter a valid vehicle number, like MP09AB1234");
        }
        if (vehicleRepo.existsByUser_IdAndNumberAndRemovedFalse(userId, number)) {
            throw new RuntimeException("You have already added this vehicle number");
        }

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setType(type);
        vehicle.setName(name);
        vehicle.setNumber(number);
        return toDto(vehicleRepo.save(vehicle));
    }

    public void remove(UUID userId, UUID vehicleId) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        if (vehicle.isRemoved() || !vehicle.getUser().getId().equals(userId)) {
            throw new RuntimeException("Vehicle not found");
        }
        if (bookingRepo.findFirstByVehicle_IdAndStatus(vehicleId, "active").isPresent()) {
            throw new RuntimeException("This vehicle is parked right now. End the parking before removing it.");
        }
        vehicle.setRemoved(true);
        vehicleRepo.save(vehicle);
    }

    private VehicleDto toDto(Vehicle v) {
        Optional<Booking> parked = bookingRepo.findFirstByVehicle_IdAndStatus(v.getId(), "active");
        return new VehicleDto(v.getId(), v.getType(), v.getName(), v.getNumber(),
                parked.map(this::parkingOf).orElse(null));
    }

    private ParkingInfoDto parkingOf(Booking b) {
        Slot slot = b.getSlot();
        Floor floor = slot.getFloor();
        Building building = floor.getBuilding();
        return new ParkingInfoDto(b.getId(), building.getId(), building.getName(),
                slot.getSlotCode(), floor.getLabel(), b.getEndTime());
    }
}
