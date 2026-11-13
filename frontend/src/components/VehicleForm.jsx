import { useState } from 'react';
import API from '../api';
import { errorText } from '../utils/booking';

export default function VehicleForm({ onAdded, onCancel }) {
  const [type, setType] = useState('car');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await API.post('/vehicles', { type, name, number });
      onAdded(res.data);
    } catch (err) {
      setError(errorText(err, 'Could not add the vehicle. Check that the backend is running.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="vehicle-form" onSubmit={submit}>
      <div className="segmented" role="group" aria-label="Vehicle type">
        <button
          type="button"
          aria-pressed={type === 'car'}
          className={type === 'car' ? 'seg active' : 'seg'}
          onClick={() => setType('car')}
        >
          Car
        </button>
        <button
          type="button"
          aria-pressed={type === 'bike'}
          className={type === 'bike' ? 'seg active' : 'seg'}
          onClick={() => setType('bike')}
        >
          Bike
        </button>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'car' ? 'Swift' : 'Activa'}
          maxLength={40}
          required
        />
      </label>
      <label className="field">
        <span>Vehicle number</span>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value.toUpperCase())}
          placeholder="MP09AB1234"
          autoComplete="off"
          required
        />
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Adding' : 'Add vehicle'}
        </button>
      </div>
    </form>
  );
}
