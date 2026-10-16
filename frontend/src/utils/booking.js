// Flat fee per booking, same as the backend's VehicleType prices (bike 30, car 40)
export const PRICE = { car: 40, bike: 30 };

// Basement 1 is cars only, Basement 2 is bikes only
export const FLOOR_LABEL = { car: 'Basement 1 (B1)', bike: 'Basement 2 (B2)' };

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// "B1-12" -> 12. Slot numbers grow with distance from the entry ramp.
export function slotNumber(code) {
  const n = parseInt(String(code).split('-')[1], 10);
  return Number.isNaN(n) ? 0 : n;
}

// Works with the new BookingDto and also with the older nested Booking shape
export function normalizeBooking(b) {
  if (!b) return null;
  const vehicle = b.vehicleType?.name ?? b.vehicleType ?? b.slot?.vehicleType;
  return {
    id: b.id,
    slotId: b.slotId ?? b.slot?.id,
    slotCode: b.slotCode ?? b.slot?.slotCode,
    vehicleType: vehicle,
    floorLabel: b.floorLabel,
    buildingId: b.buildingId,
    buildingName: b.buildingName,
    endTime: b.endTime,
    price: b.price,
  };
}

export function errorText(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  return fallback;
}
