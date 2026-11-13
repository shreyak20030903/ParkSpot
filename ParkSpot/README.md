# Backend changes, round 3: vehicles, flat short-stay prices

This round replaces some files from `backend-v2` and adds new ones. **Files here with the same name as a `backend-v2` file replace it.** Everything else from `backend-v2` (the other DTOs, `DataSeeder`, `BuildingController`) stays as it is.

All files already have your package names (`com.Shreya.parkspot...`).

| File | Where | |
|---|---|---|
| `Entity/Vehicle.java` | `Entity` | new |
| `Dto/ParkingInfoDto.java`, `VehicleDto.java`, `VehicleRequest.java` | `Dto` | new |
| `Dto/BookingDto.java`, `BuildingDto.java` | `Dto` | replace (vehicle fields, new price fields) |
| `Repository/VehicleRepository.java` | `Repository` | new |
| `Service/VehicleService.java` | `Service` | new |
| `Service/PricingService.java`, `BuildingService.java`, `BookingService.java` | `Service` | replace |
| `Controller/VehicleController.java` | `Controller` | new |
| `Controller/BookingController.java` | `Controller` | replace |

## Two small edits in files you already have

**1. `Entity/Booking.java`:** add the vehicle the booking is for
```java
@ManyToOne
@JoinColumn(name = "vehicle_id")
@JsonIgnore
private Vehicle vehicle;
```

**2. `Repository/BookingRepository.java`:** add
```java
Optional<Booking> findFirstByVehicle_IdAndStatus(UUID vehicleId, String status);
```
(`findByUser_IdAndStatus` and `findByStatusAndEndTimeBefore` must already be there.)

## Clear the old test bookings, then restart

Bookings made before vehicles existed have no vehicle, so end them once. In MySQL:
```sql
SET SQL_SAFE_UPDATES = 0;
UPDATE booking SET status = 'completed' WHERE status = 'active';
UPDATE slot SET status = 'free';
SET SQL_SAFE_UPDATES = 1;
```
`ddl-auto=update` creates the `vehicle` table and the `vehicle_id` column by itself.

## What changed

- **Prices:** any stay under a day costs one flat price: car 30, bike 20, in every building. From a day up it is per day (airport car 100, station car 60, bikes less), with 20% off from 7 days, 35% off from 15 days, and a flat price for a month. All numbers are in one table at the top of `PricingService`.
- **Vehicles:** a user adds cars and bikes (type, name, number). `GET /vehicles` lists them, each with where it is parked right now.
- **Booking is per vehicle:** `POST /bookings` now takes `vehicleId`. A vehicle can be parked once, but the same user can have several vehicles parked in different cities. A car cannot take a bike bay. If the vehicle is already parked, the error says where.
- **`GET /bookings/active`** now returns a list, empty when nothing is parked (no more 400 for "none").
- Removing a vehicle hides it and keeps its past bookings. A parked vehicle cannot be removed.
