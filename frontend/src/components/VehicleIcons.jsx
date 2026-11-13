// Top-down car and bike, drawn nose-in like a parked vehicle
export function CarIcon() {
  return (
    <svg viewBox="0 0 36 52" aria-hidden="true">
      <rect x="1" y="14" width="4" height="6" rx="1.5" fill="currentColor" />
      <rect x="31" y="14" width="4" height="6" rx="1.5" fill="currentColor" />
      <rect x="4" y="2" width="28" height="48" rx="11" fill="currentColor" />
      <rect x="8" y="12" width="20" height="9" rx="2.5" fill="#fff" opacity="0.85" />
      <rect x="9" y="22" width="18" height="11" rx="3" fill="#fff" opacity="0.22" />
      <rect x="8" y="35" width="20" height="7" rx="2.5" fill="#fff" opacity="0.75" />
      <rect x="7" y="3.5" width="6" height="3" rx="1.5" fill="#fff7c2" />
      <rect x="23" y="3.5" width="6" height="3" rx="1.5" fill="#fff7c2" />
    </svg>
  );
}

export function BikeIcon() {
  return (
    <svg viewBox="0 0 20 44" aria-hidden="true">
      <rect x="8" y="0" width="4" height="11" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="8" y="33" width="4" height="11" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="8.5" y="6" width="3" height="32" rx="1.5" fill="currentColor" />
      <rect x="1" y="9" width="18" height="3" rx="1.5" fill="currentColor" />
      <ellipse cx="10" cy="27" rx="4.5" ry="5.5" fill="currentColor" />
    </svg>
  );
}
