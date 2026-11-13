import { formatShort, formatWhen, slotNumber } from '../utils/booking';
import { BikeIcon, CarIcon } from './VehicleIcons.jsx';

const PER_ROW = 10;
const HALF = PER_ROW / 2;

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function Bay({ slot, state, vehicleType, onSelect }) {
  let note = '';
  let label = `Bay ${slot.slotCode}, free. Select to book.`;
  if (state === 'booked') {
    const until = formatWhen(slot.occupiedUntil);
    note = formatShort(slot.occupiedUntil) || 'Taken';
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
      title={state === 'booked' && slot.occupiedUntil ? `Taken until ${formatWhen(slot.occupiedUntil)}` : undefined}
    >
      <span className="slot-code">{slot.slotCode}</span>
      {showVehicle && (
        <span className="slot-vehicle">{vehicleType === 'car' ? <CarIcon /> : <BikeIcon />}</span>
      )}
      {note && <span className="slot-note">{note}</span>}
    </button>
  );
}

function Row({ slots, vehicleType, stateOf, onSelect, layout }) {
  const cells = [];
  for (let i = 0; i < PER_ROW; i += 1) {
    if (i === HALF) {
      cells.push(<span key="divider" className={layout === 'open' ? 'lamp' : 'pillar'} aria-hidden="true" />);
    }
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

// Top-down view of one parking: rows of bays facing a driveway.
// Basements have pillars; open-air lots have lamp posts.
export default function BasementMap({ slots, vehicleType, mySlotId, suggestedId, onSelect, layout = 'basement' }) {
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
        <span>
          {layout === 'open' ? 'Entry gate' : 'Entry and exit ramp'}. Bay numbers grow as you drive further in.
        </span>
      </div>
      <div className="basement-scroll">
        <div className={layout === 'open' ? 'floor open' : 'floor'}>
          {aisles.map((pair, i) => (
            <div className="aisle" key={i}>
              <Row slots={pair[0]} vehicleType={vehicleType} stateOf={stateOf} onSelect={onSelect} layout={layout} />
              <div className="lane" aria-hidden="true"><span>Driveway</span></div>
              {pair[1] ? (
                <Row slots={pair[1]} vehicleType={vehicleType} stateOf={stateOf} onSelect={onSelect} layout={layout} />
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
