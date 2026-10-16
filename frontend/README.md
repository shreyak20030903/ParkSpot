# ParkSpot frontend

React + Vite frontend for ParkSpot, a parking slot finder and booking app for malls and office buildings.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The backend must be running on http://localhost:8080. If it runs somewhere else, copy `.env.example` to `.env` and set `VITE_API_URL`.

Vite uses port 5173, so the backend's CORS config must allow `http://localhost:5173`.

## Screens

- **Login and register:** illustrated landing panel, JWT login, errors from the backend are shown as they are.
- **Buildings:** asks for your location and lists buildings within 4 km, nearest first, with distance and free bays. Search by city, or go back to "Near me". If you have an active booking, a card at the top shows where you parked.
- **Bays:** a top-down basement map with rows of bays, a driveway and pillars. Basement 1 is cars (larger bays), Basement 2 is bikes (smaller bays).
  - Green is free, red is taken (with the time it frees up), purple is your bay, yellow is the suggested bay.
  - Click a free bay to pay and book it. Click your purple bay to unbook it (with a confirmation).
  - A banner says "Active parking in this building" when your booking is in the building you are viewing.
  - Logging out is blocked while you hold an active booking.

## How it behaves

- **Park here:** the free bay with the lowest bay number is suggested, on the assumption that bay numbers grow with distance from the entry ramp. It re-computes live as bays fill up. It is a simple rule, not a routing algorithm.
- **Live updates:** the page subscribes to `/topic/building/{id}` over WebSocket (STOMP over SockJS). Any message means "refetch the bays". While the socket is down it polls every 10 seconds and the header shows "Reconnecting".
- **Payment:** a demo checkout (UPI or card form). Nothing is sent anywhere and no money moves. The booking request is only sent after the demo payment succeeds. A real gateway would need an order created and verified on the backend.
- **Duration:** the driver picks 1 to 4 hours; the fee is a flat price per vehicle type, as in the backend.

## Backend contract

| Endpoint | Used for |
|---|---|
| `POST /auth/login`, `POST /auth/register` | Login returns `{ token, name, email }` |
| `GET /buildings/nearby?lat&lng&radiusKm` | Items: `id, name, city, distanceKm, freeSlots, totalSlots` |
| `GET /buildings?city=` | Same items without `distanceKm` |
| `GET /buildings/{id}/slots?vehicleType=` | Items: `id, slotCode, vehicleType, status, occupiedUntil` |
| `POST /bookings?slotId&durationMinutes` | Returns a booking with `slotId, slotCode, floorLabel, buildingId, buildingName, endTime` |
| `GET /bookings/active` | Same booking shape, 400 when there is none |
| `PATCH /bookings/{id}/end` | Ends the booking |
| WebSocket `/ws`, topic `/topic/building/{id}` | "changed" signal |

The extra fields (`distanceKm`, `freeSlots`, `occupiedUntil`, `buildingName`, and so on) are optional: the UI simply hides what the backend does not send.

## Structure

```
src/
  api.js                 axios client with JWT and 401 handling
  pages/                 Login, BuildingList, SlotGrid
  components/            BasementMap, PaymentModal, ConfirmDialog, Header, Toast
  hooks/                 useActiveBooking, useBuildingSocket, useToast
  utils/booking.js       prices, floor labels, formatting
  assets/basement-city.svg
```
