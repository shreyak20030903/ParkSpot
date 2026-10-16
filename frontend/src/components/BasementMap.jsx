import { formatTime, slotNumber } from '../utils/booking';

const PER_ROW = 10;
const HALF = PER_ROW / 2;

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Top-down car and bike, drawn nose-in like a parked vehicle
function CarIcon() {
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

function BikeIcon() {
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

function Bay({ slot, state, vehicleType, onSelect }) {
  let note = '';
  let label = `Bay ${slot.slotCode}, free. Select to book.`;
  if (state === 'booked') {
    const until = formatTime(slot.occupiedUntil);
    note = until || 'Taken';
    label = until ? `Bay ${slot.slotCode}, taken until ${until}.` : `Bay ${slot.slotCode}, taken.`;
  } else if (state === 'mine') {
    note = 'Yours';
    label = `Bay ${slot.slotCode}, your booking. Select to unbook.`;
  } else if (state === 'suggested') {
    note = 'Park here';
    label = `Bay ${slot.slotCode}, suggested. Select to book.`;
  }
  const showVehicle = state === 'booked' || state === 'mine';

  return (
    <button
      type="button"
      className={`slot ${state} ${vehicleType}${showVehicle ? ' has-vehicle' : ''}`}
      disabled={state === 'booked'}
      onClick={() => onSelect(slot)}
      aria-label={label}
    >
      <span className="slot-code">{slot.slotCode}</span>
      {showVehicle && (
        <span className="slot-vehicle">{vehicleType === 'car' ? <CarIcon /> : <BikeIcon />}</span>
      )}
      {note && <span className="slot-note">{note}</span>}
    </button>
  );
}

function Row({ slots, vehicleType, stateOf, onSelect }) {
  const cells = [];
  for (let i = 0; i < PER_ROW; i += 1) {
    if (i === HALF) cells.push(<span key="pillar" className="pillar" aria-hidden="true" />);
    const slot = slots[i];
    cells.push(
      slot ? (
        <Bay
          key={slot.id}
          slot={slot}
          state={stateOf(slot)}
          vehicleType={vehicleType}
          onSelect={onSelect}
        />
      ) : (
        <span key={`empty-${i}`} className="bay-empty" aria-hidden="true" />
      )
    );
  }
  return <div className="bay-row">{cells}</div>;
}

// Top-down view of one basement: rows of bays facing a driveway, with pillars.
export default function BasementMap({ slots, vehicleType, mySlotId, suggestedId, onSelect }) {
  const sorted = [...slots].sort((a, b) => slotNumber(a.slotCode) - slotNumber(b.slotCode));
  const aisles = chunk(chunk(sorted, PER_ROW), 2);

  const stateOf = (slot) => {
    if (slot.id === mySlotId) return 'mine';
    if (slot.status !== 'free') return 'booked';
    if (slot.id === suggestedId) return 'suggested';
    return 'free';
  };

  return (
    <div className="basement">
      <div className="entry-strip">
        <span className="entry-flag" aria-hidden="true">▼</span>
        <span>Entry and exit ramp. Bay numbers grow as you drive further in.</span>
      </div>
      <div className="basement-scroll">
        <div className="floor">
          {aisles.map((pair, i) => (
            <div className="aisle" key={i}>
              <Row slots={pair[0]} vehicleType={vehicleType} stateOf={stateOf} onSelect={onSelect} />
              <div className="lane" aria-hidden="true"><span>Driveway</span></div>
              {pair[1] ? (
                <Row slots={pair[1]} vehicleType={vehicleType} stateOf={stateOf} onSelect={onSelect} />
              ) : (
                <div className="bay-row bay-row-blank" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
