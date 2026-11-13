// Used only if the building details endpoint is not available
export const PRICE = { car: 30, bike: 20 };
export const FLOOR_LABEL = { car: 'Basement 1 (B1)', bike: 'Basement 2 (B2)' };

// How each kind of building looks and parks. Malls have basements, the rest are open lots.
export const TYPE_META = {
  mall: { label: 'Mall', color: '#3a6ae0', layout: 'basement' },
  airport: { label: 'Airport', color: '#0e9aa7', layout: 'open' },
  railway: { label: 'Railway station', color: '#e8801f', layout: 'open' },
};

export function metaOf(type) {
  return TYPE_META[type] || TYPE_META.mall;
}

export function formatRupees(n) {
  return `\u20B9${Number(n).toLocaleString('en-IN')}`;
}

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function timeOf(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// "today, 5:30 PM", "tomorrow, 3:41 AM" or "Mon, 27 Oct, 3:41 AM"
export function formatWhen(iso) {
  const d = toDate(iso);
  if (!d) return '';
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `today, ${timeOf(d)}`;
  if (sameDay(d, tomorrow)) return `tomorrow, ${timeOf(d)}`;
  const date = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${date}, ${timeOf(d)}`;
}

// Short form for a narrow bay: the time if it is today, otherwise the date
export function formatShort(iso) {
  const d = toDate(iso);
  if (!d) return '';
  if (sameDay(d, new Date())) return timeOf(d);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// "B1-12" -> 12. Slot numbers grow with distance from the entry.
export function slotNumber(code) {
  const n = parseInt(String(code).split('-')[1], 10);
  return Number.isNaN(n) ? 0 : n;
}

export function normalizeBooking(b) {
  if (!b) return null;
  return {
    id: b.id,
    slotId: b.slotId,
    slotCode: b.slotCode,
    vehicleType: b.vehicleType,
    floorLabel: b.floorLabel,
    buildingId: b.buildingId,
    buildingName: b.buildingName,
    endTime: b.endTime,
    price: b.price,
    vehicleId: b.vehicleId,
    vehicleName: b.vehicleName,
    vehicleNumber: b.vehicleNumber,
  };
}

// "Parked at Pune Airport, bay CP-12, until Mon, 27 Oct, 3:41 AM" or "Not parked"
export function parkingText(vehicle) {
  const p = vehicle?.parking;
  if (!p) return 'Not parked';
  const until = formatWhen(p.endTime);
  return `Parked at ${p.buildingName}, bay ${p.slotCode}${until ? `, until ${until}` : ''}`;
}

export function errorText(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  return fallback;
}
