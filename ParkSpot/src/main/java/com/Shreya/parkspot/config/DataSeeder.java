package com.Shreya.parkspot.config;

import com.Shreya.parkspot.Entity.Building;
import com.Shreya.parkspot.Entity.Floor;
import com.Shreya.parkspot.Entity.Slot;
import com.Shreya.parkspot.Entity.VehicleType;
import com.Shreya.parkspot.Repository.BuildingRepository;
import com.Shreya.parkspot.Repository.FloorRepository;
import com.Shreya.parkspot.Repository.SlotRepository;
import com.Shreya.parkspot.Repository.VehicleTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private VehicleTypeRepository vehicleTypeRepo;
    @Autowired private BuildingRepository buildingRepo;
    @Autowired private FloorRepository floorRepo;
    @Autowired private SlotRepository slotRepo;

    @Override
    public void run(String... args) {
        if (vehicleTypeRepo.count() == 0) {
            VehicleType bike = new VehicleType();
            bike.setName("bike");
            bike.setPrice(new BigDecimal("30"));
            vehicleTypeRepo.save(bike);

            VehicleType car = new VehicleType();
            car.setName("car");
            car.setPrice(new BigDecimal("40"));
            vehicleTypeRepo.save(car);
        }

        if (buildingRepo.count() == 0) {
            seedBuilding("Phoenix Citadel", "Indore", 22.7196, 75.8577);
            seedBuilding("C21 Mall", "Indore", 22.7532, 75.8937);
            seedBuilding("Treasure Island", "Indore", 22.7245, 75.8800);
        }
    }

    private void seedBuilding(String name, String city, double lat, double lng) {
        Building building = new Building();
        building.setName(name);
        building.setCity(city);
        building.setLatitude(lat);
        building.setLongitude(lng);
        buildingRepo.save(building);

        // Basement 1 — sirf cars
        seedFloor(building, "Basement 1", "B1", "car", 40);
        // Basement 2 — sirf bikes
        seedFloor(building, "Basement 2", "B2", "bike", 35);
    }

    private void seedFloor(Building building, String label, String shortCode, String vehicleType, int totalSlots) {
        Floor floor = new Floor();
        floor.setLabel(label);
        floor.setTotalSlots(totalSlots);
        floor.setBuilding(building);
        floorRepo.save(floor);

        for (int i = 1; i <= totalSlots; i++) {
            Slot slot = new Slot();
            slot.setSlotCode(shortCode + "-" + i);
            slot.setVehicleType(vehicleType);
            slot.setStatus("free");
            slot.setFloor(floor);
            slotRepo.save(slot);
        }
    }
}