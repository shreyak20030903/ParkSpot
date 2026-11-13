import { BikeIcon, CarIcon } from './VehicleIcons.jsx';

// The vehicle being driven today. Clicking it lets the user change it.
export default function VehicleChip({ vehicle, onClick }) {
  return (
    <button type="button" className="vehicle-chip" onClick={onClick}>
      <span className={`vehicle-icon ${vehicle.type}`}>
        {vehicle.type === 'car' ? <CarIcon /> : <BikeIcon />}
      </span>
      <span className="vehicle-chip-text">
        <span className="vehicle-chip-label">Driving today</span>
        <strong>{vehicle.name}</strong>
        <span className="vehicle-number">{vehicle.number}</span>
      </span>
      <span className="vehicle-chip-change">Change</span>
    </button>
  );
}
