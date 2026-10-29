# ParkSpot: Smart Parking Slot Finder & Booking System

ParkSpot helps drivers find and book a parking bay in malls, airports and railway stations before they arrive. Bays are shown as a live map, and two people can never book the same bay at the same time (Redis-based locking).

> **Status:** work in progress. The booking flow works end to end. See [Known limitations](#known-limitations) and [Planned](#planned).

## Features

- **Accounts:** register and log in with JWT. Passwords are hashed with BCrypt, and every booking endpoint reads the user from the token, not from the request.
- **Find parking:** buildings within 4 km of your location, nearest first, or browse Indore, Pune, Mumbai and Delhi. Malls, airports and railway stations, each shown as a name pin on a map, with a photo, free bays and the hourly price.
- **Two kinds of parking:** malls are underground (Basement 1 for cars, Basement 2 for bikes). Airports and railway stations are open air, with a car park and a bike park side by side.
- **Pricing by parking time:** malls offer 1 to 8 hours. Airports and stations offer 6 hours up to 1 month (1, 2, 4, 7, 15 days), with discounts on long stays, for people who park and travel to another city. Prices are calculated on the server.
- **Booking map:** a top-down map of the parking. Taken bays show a vehicle and the time they free up. A "Park here" suggestion points to the free bay closest to the entry.
- **Live updates:** WebSocket (STOMP over SockJS), so a bay booked on one screen turns red on every other screen.
- **Concurrency-safe booking:** a Redis lock stops two users from booking the same bay at once.
- **One active booking per user**, unbooking with confirmation, and the active booking shown on the buildings page. Logout is blocked while a booking is active.
- **Expiry job:** a scheduled task frees the bays of bookings whose time is over.
- **Demo data:** 22 buildings seeded on first run.

## How double-booking is prevented

1. The server tries to acquire a Redis lock for the bay (`SET key value NX` with a 5-second expiry, via `setIfAbsent`).
2. If the lock is already held, the request is rejected straight away.
3. Otherwise, inside a database transaction, it checks that the user has no other active booking and that the bay is still free, calculates the price, saves the booking and marks the bay booked.
4. The transaction commits before the lock is released (a `TransactionTemplate` inside the lock). Releasing the lock first would let a second request read the bay as still free.

The live-update message is sent only after the transaction commits, so screens never refetch data that is not saved yet.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Leaflet (map), STOMP over SockJS |
| Backend | Java, Spring Boot, Spring Data JPA (Hibernate), Spring Security (JWT), Spring WebSocket, Lombok |
| Database | MySQL |
| Locking | Redis (Spring Data Redis) |

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Create an account, log in (returns a JWT) |
| GET | `/buildings/nearby?lat=&lng=&radiusKm=` | Buildings within a radius, nearest first |
| GET | `/buildings?city=` | Buildings in a city |
| GET | `/buildings/{id}` | One building: type, photo, floors |
| GET | `/buildings/{id}/pricing?vehicleType=` | Parking times and their prices |
| GET | `/buildings/{id}/slots?vehicleType=` | Bays, with the time each taken bay frees up |
| POST | `/bookings?slotId=&durationMinutes=` | Book a bay (Redis lock and transaction) |
| GET | `/bookings/active` | The current user's active booking |
| PATCH | `/bookings/{id}/end` | End a booking and free the bay |
| WebSocket | `/ws`, topic `/topic/building/{id}` | Live "changed" signal |

## Run locally

**Prerequisites:** JDK 17+, Node.js, MySQL, Redis (on Windows, [Memurai](https://www.memurai.com/) works as a Redis-compatible server).

**Backend**

1. Make sure MySQL and Redis are running.
2. Set two environment variables: `DB_PASSWORD` (your MySQL password) and `JWT_SECRET` (any random string of 32 or more characters).
3. Run `ParkSpotApplication`. The backend starts on `http://localhost:8080`, creates the tables and seeds the demo buildings on first run.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

The app opens on `http://localhost:5173`. The backend URL can be changed with `VITE_API_URL` (see `.env.example`).

## Known limitations

- **The payment step is a demo.** Nothing is charged and nothing typed there leaves the browser. A real gateway needs an order created and the payment verified on the backend.
- **The demo data is invented.** Building names are real places, but the bay counts, availability and prices are made up, and the coordinates are approximate. This project has no connection with those places.
- **"Park here" is a simple rule:** the free bay with the lowest bay number, assuming numbers grow with distance from the entry.
- **Vehicles are not detected automatically.** A car that parks without the app is not booked. That would need number-plate cameras or a sensor in each bay.

## Planned

- Real payment integration
- Pick an exact end time, not only a fixed list of durations
- Admin screen to manage buildings and prices

## Author

**Shreya Kushwaha**: [GitHub](https://github.com/shreyak20030903) · [LinkedIn](https://www.linkedin.com/in/shreya-kushwaha-45138928a/)
