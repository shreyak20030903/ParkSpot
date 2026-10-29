# ParkSpot frontend

React + Vite frontend for ParkSpot, a parking slot finder and booking app for malls, airports and railway stations.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The backend must be running on http://localhost:8080. If it runs somewhere else, copy `.env.example` to `.env` and set `VITE_API_URL`.

Vite uses port 5173, so the backend's CORS config must allow `http://localhost:5173`. The map loads its tiles from the internet, so it needs a connection.

## Screens

- **Login and register:** illustrated landing panel, JWT login, errors from the backend are shown as they are.
- **Buildings:** a list and a map side by side. Pick "Near me" (your location, 4 km, nearest first) or a city (Indore, Pune, Mumbai, Delhi), or search for a city. Every building has a photo (or an illustration), its type, whether the parking is underground or open air, free bays and the hourly price. Each building is a pin on the map with its name; hovering a card highlights its pin, and clicking a pin opens a small card with "View bays". If you have an active booking, a card at the top shows where you parked.
- **Bays:** a top-down map of the parking.
  - Malls are underground: rows of bays facing a driveway, with pillars.
  - Airports and railway stations are open air: the same rows, with lamp posts and an entry gate instead.
  - Green is free, red is taken (with a car icon and the time it frees up), purple is your bay, yellow is the suggested bay.
  - Click a free bay to pay and book it. Click your purple bay to unbook it (with a confirmation).
  - A banner says "Active parking in this building" when your booking is in the building you are viewing.
  - Logging out is blocked while you hold an active booking.

## How it behaves

- **Park here:** the free bay with the lowest bay number is suggested, on the assumption that bay numbers grow with distance from the entry. It re-computes live as bays fill up. It is a simple rule, not a routing algorithm.
- **Live updates:** the page subscribes to `/topic/building/{id}` over WebSocket (STOMP over SockJS). Any message means "refetch the bays". While the socket is down it polls every 10 seconds and the header shows "Reconnecting".
- **Pricing:** the payment step asks the server for the parking times and prices of that building and vehicle (`GET /buildings/{id}/pricing`). Malls offer 1 to 8 hours. Airports and stations offer 6 hours up to 1 month. The server calculates the price; the browser only sends the number of minutes.
- **Payment:** a demo checkout (UPI or card form). Nothing is sent anywhere and no money moves. The booking request is only sent after the demo payment succeeds.
- **Photos:** put `<building-name-with-dashes>.jpg` files in `public/images/` (see the README there for the exact names). Without a file the app shows an illustration of a mall, airport or station.

## Backend contract

| Endpoint | Used for |
|---|---|
| `POST /auth/login`, `POST /auth/register` | Login returns `{ token, name, email }` |
| `GET /buildings/nearby?lat&lng&radiusKm` | Items: `id, name, city, type, imageUrl, latitude, longitude, distanceKm, freeSlots, totalSlots, carPerHour, bikePerHour` |
| `GET /buildings?city=` | Same items without `distanceKm` |
| `GET /buildings/{id}` | `id, name, city, type, imageUrl, floors[{label, vehicleType, totalSlots}]` |
| `GET /buildings/{id}/pricing?vehicleType=` | `[{label, minutes, price}]` |
| `GET /buildings/{id}/slots?vehicleType=` | Items: `id, slotCode, vehicleType, status, occupiedUntil` |
| `POST /bookings?slotId&durationMinutes` | Returns a booking with `slotId, slotCode, floorLabel, buildingId, buildingName, endTime` |
| `GET /bookings/active` | Same booking shape, 400 when there is none |
| `PATCH /bookings/{id}/end` | Ends the booking |
| WebSocket `/ws`, topic `/topic/building/{id}` | "changed" signal |

The extra fields are optional: the UI simply hides what the backend does not send. `type` is `mall`, `airport` or `railway`.

Building names in the demo data are real places, but the bay counts, availability and prices are invented.

## Structure

```
src/
  api.js                 axios client with JWT and 401 handling
  pages/                 Login, BuildingList, SlotGrid
  components/            BuildingMap, BuildingArt, BasementMap, PaymentModal, ConfirmDialog, BackButton, Header, Toast
  hooks/                 useActiveBooking, useBuildingSocket, useToast
  utils/booking.js       building types, formatting, helpers
  assets/basement-city.svg
public/images/           building photos (optional)
```
