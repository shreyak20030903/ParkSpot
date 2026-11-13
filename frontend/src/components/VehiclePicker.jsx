import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VehicleForm from './VehicleForm.jsx';
import { BikeIcon, CarIcon } from './VehicleIcons.jsx';
import { parkingText } from '../utils/booking';

// "Which vehicle are you driving today?" Add one here if the list is empty.
export default function VehiclePicker({ vehicles, selectedId, onSelect, onAdded, onClose }) {
  const [adding, setAdding] = useState(vehicles.length === 0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="picker-title">
          {adding ? 'Add a vehicle' : 'Which vehicle are you driving today?'}
        </h2>

        {!adding && (
          <>
            <ul className="vehicle-options">
              {vehicles.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className={v.id === selectedId ? 'vehicle-option is-selected' : 'vehicle-option'}
                    onClick={() => { onSelect(v.id); onClose(); }}
                  >
                    <span className={`vehicle-icon ${v.type}`}>
                      {v.type === 'car' ? <CarIcon /> : <BikeIcon />}
                    </span>
                    <span className="vehicle-option-text">
                      <strong>{v.name}</strong>
                      <span className="vehicle-number">{v.number}</span>
                      <span className={v.parking ? 'vehicle-status parked' : 'vehicle-status'}>
                        {parkingText(v)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="modal-actions picker-actions">
              <Link to="/vehicles" className="btn btn-ghost">Manage vehicles</Link>
              <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
                Add a vehicle
              </button>
            </div>
          </>
        )}

        {adding && (
          <VehicleForm
            onAdded={(v) => { onAdded(v); onClose(); }}
            onCancel={vehicles.length > 0 ? () => setAdding(false) : onClose}
          />
        )}
      </div>
    </div>
  );
}
