# ParkSpot — Smart Parking Slot Finder & Booking System

ParkSpot helps drivers find and reserve a parking slot in nearby malls and office buildings before they arrive, so they don't spend time circling a full basement. Slots are shown as a live grid, and two people can never book the same slot at the same time (Redis-based locking).

> **Status:** work in progress. The core booking flow is complete and working. See [Planned](#planned) for what is still to come.

## Features (implemented)

- **Register / Login** with BCrypt-hashed passwords (Spring Security)
- **Live location search:** uses the browser's GPS to list buildings within 4 km, sorted nearest to farthest (Haversine distance calculation on the backend)
- **Manual search** by city
- **Slot grid per building**, filtered by vehicle type
  - Basement 1 (B1): cars only, 40 slots
  - Basement 2 (B2): bikes only, 35 slots
- **Booking with fixed pricing** by vehicle type (bike ₹30, car ₹40)
- **Concurrency-safe booking:** a Redis lock stops two users from booking the same slot at once
- **One active booking per user**
- **Book / unbook from the grid:** green = free, purple = your slot, red = booked by someone else; unbooking asks for confirmation
- **Active booking banner** showing which slot you parked in
- **Logout is blocked while a booking is active** (unbook first)
- **Seed data:** 3 sample buildings in Indore, each with both basements, created automatically on first run

## How double-booking is prevented

When a user books a slot, the backend does the following inside a single transaction:

1. Tries to acquire a Redis lock for that slot (`SET key value NX` with a 5-second expiry, via `setIfAbsent`)
2. If the lock is already held, the request is rejected immediately ("being booked by someone else")
3. Otherwise it checks the slot is still free, checks the user has no other active booking, creates the booking and marks the slot booked
4. The lock is always released in a `finally` block, and the expiry makes sure a crashed request can't leave a slot locked forever

If anything fails midway, `@Transactional` rolls the whole operation back, so a slot is never left "booked" without a matching booking.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Axios |
| Backend | Java, Spring Boot, Spring Data JPA (Hibernate), Spring Security, Lombok |
| Database | MySQL |
| Locking | Redis (Spring Data Redis) |

## Data model

`Building → Floor → Slot`, plus `User`, `VehicleType` (with price) and `Booking` (user, slot, vehicle type, start/end time, price, status).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in |
| GET | `/buildings?city=` | Buildings in a city |
| GET | `/buildings/nearby?lat=&lng=&radiusKm=` | Buildings within a radius, nearest first |
| GET | `/buildings/{id}/slots?vehicleType=` | Slots of a building for a vehicle type |
| POST | `/bookings` | Book a slot (Redis lock + transaction) |
| GET | `/bookings/active?userId=` | The user's current booking |
| PATCH | `/bookings/{id}/end` | End a booking and free the slot |

## Run locally

**Prerequisites:** JDK 17+, Node.js, MySQL, Redis (on Windows, [Memurai](https://www.memurai.com/) works as a Redis-compatible server).

**Backend**

1. Make sure MySQL and Redis are running.
2. Set your database password as an environment variable (`DB_PASSWORD`). `application.properties` reads it:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/parkspot?createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=${DB_PASSWORD}
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   ```
3. Run `ParkSpotApplication`. The backend starts on `http://localhost:8080`, creates the tables and seeds sample data on first run.

**Frontend**

```bash
cd parkspot-frontend
npm install
npm start
```

The app opens on `http://localhost:3000`. The backend URL is set in `src/api.js`.

## Known limitations

- Login currently stores the user id on the client and endpoints take `userId` as a parameter; proper token-based auth (JWT) is not implemented yet
- Booking duration is fixed at 2 hours and there is no payment step yet (the price is only shown in a confirmation prompt)
- Expired bookings are not freed automatically; a user has to unbook

## Planned

- JWT authentication and protected routes
- Scheduled job to auto-complete expired bookings
- Choose booking duration / exact end time, and show when an occupied slot becomes free
- Real-time slot updates with WebSocket
- Payment integration
- Better floor layout UI

## Author

**Shreya Kushwaha** — [GitHub](https://github.com/shreyak20030903) · [LinkedIn](https://www.linkedin.com/in/shreya-kushwaha-45138928a/)
