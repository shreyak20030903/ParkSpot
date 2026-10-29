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
import java.util.ArrayList;
import java.util.List;

/**
 * Demo data. Names are real places, but availability and prices are made up,
 * and the coordinates are approximate. Safe to run on every start: a building
 * that already exists (matched by name) is skipped.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private VehicleTypeRepository vehicleTypeRepo;
    @Autowired private BuildingRepository buildingRepo;
    @Autowired private FloorRepository floorRepo;
    @Autowired private SlotRepository slotRepo;

    private record Spot(String name, String city, String type, double lat, double lng) {}

    private record FloorPlan(String label, String code, String vehicleType, int slots) {}

    private static final List<Spot> CATALOG = List.of(
            // Indore
            new Spot("Phoenix Citadel", "Indore", "mall", 22.7196, 75.8577),
            new Spot("C21 Mall", "Indore", "mall", 22.7532, 75.8937),
            new Spot("Treasure Island", "Indore", "mall", 22.7245, 75.8800),
            new Spot("Indore Airport", "Indore", "airport", 22.7218, 75.8011),
            new Spot("Indore Junction Railway Station", "Indore", "railway", 22.7177, 75.8666),
            // Pune
            new Spot("Phoenix Marketcity Pune", "Pune", "mall", 18.5623, 73.9167),
            new Spot("Amanora Mall", "Pune", "mall", 18.5196, 73.9300),
            new Spot("Pavilion Mall Pune", "Pune", "mall", 18.5342, 73.8305),
            new Spot("Pune Airport", "Pune", "airport", 18.5822, 73.9197),
            new Spot("Pune Railway Station", "Pune", "railway", 18.5290, 73.8742),
            // Mumbai
            new Spot("Phoenix Palladium", "Mumbai", "mall", 18.9949, 72.8258),
            new Spot("Infiniti Mall Andheri", "Mumbai", "mall", 19.1396, 72.8346),
            new Spot("R City Mall", "Mumbai", "mall", 19.0997, 72.9166),
            new Spot("Mumbai Airport Terminal 2", "Mumbai", "airport", 19.0887, 72.8679),
            new Spot("Chhatrapati Shivaji Maharaj Terminus", "Mumbai", "railway", 18.9402, 72.8356),
            new Spot("Dadar Railway Station", "Mumbai", "railway", 19.0186, 72.8426),
            // Delhi
            new Spot("Select Citywalk", "Delhi", "mall", 28.5286, 77.2197),
            new Spot("DLF Promenade", "Delhi", "mall", 28.5419, 77.1547),
            new Spot("Pacific Mall Tagore Garden", "Delhi", "mall", 28.6447, 77.1136),
            new Spot("Delhi Airport Terminal 3", "Delhi", "airport", 28.5562, 77.1000),
            new Spot("New Delhi Railway Station", "Delhi", "railway", 28.6420, 77.2197),
            new Spot("Hazrat Nizamuddin Railway Station", "Delhi", "railway", 28.5882, 77.2541));

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

        for (Spot spot : CATALOG) {
            if (!buildingRepo.existsByName(spot.name())) {
                seedBuilding(spot);
            }
        }

        // Buildings saved before the type and photo columns existed
        for (Building b : buildingRepo.findAll()) {
            boolean changed = false;
            if (b.getType() == null) {
                b.setType("mall");
                changed = true;
            }
            if (b.getImageUrl() == null) {
                b.setImageUrl("/images/" + slug(b.getName()) + ".jpg");
                changed = true;
            }
            if (changed) {
                buildingRepo.save(b);
            }
        }
    }

    private void seedBuilding(Spot spot) {
        Building building = new Building();
        building.setName(spot.name());
        building.setCity(spot.city());
        building.setType(spot.type());
        building.setImageUrl("/images/" + slug(spot.name()) + ".jpg");
        building.setLatitude(spot.lat());
        building.setLongitude(spot.lng());
        buildingRepo.save(building);

        for (FloorPlan plan : plansFor(spot.type())) {
            seedFloor(building, plan);
        }
    }

    // Malls have two basements. Airports and stations have open parking, side by side.
    private static List<FloorPlan> plansFor(String type) {
        return switch (type) {
            case "airport" -> List.of(
                    new FloorPlan("Car park", "CP", "car", 60),
                    new FloorPlan("Bike park", "BP", "bike", 40));
            case "railway" -> List.of(
                    new FloorPlan("Car park", "CP", "car", 50),
                    new FloorPlan("Bike park", "BP", "bike", 40));
            default -> List.of(
                    new FloorPlan("Basement 1", "B1", "car", 40),
                    new FloorPlan("Basement 2", "B2", "bike", 35));
        };
    }

    private void seedFloor(Building building, FloorPlan plan) {
        Floor floor = new Floor();
        floor.setLabel(plan.label());
        floor.setTotalSlots(plan.slots());
        floor.setBuilding(building);
        floorRepo.save(floor);

        List<Slot> slots = new ArrayList<>();
        for (int i = 1; i <= plan.slots(); i++) {
            Slot slot = new Slot();
            slot.setSlotCode(plan.code() + "-" + i);
            slot.setVehicleType(plan.vehicleType());
            slot.setStatus("free");
            slot.setFloor(floor);
            slots.add(slot);
        }
        slotRepo.saveAll(slots);
    }

    // "Phoenix Citadel" -> "phoenix-citadel". The photo for a building is /images/<slug>.jpg
    static String slug(String name) {
        return name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}