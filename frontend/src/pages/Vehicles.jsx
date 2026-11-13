import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import BackButton from '../components/BackButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import VehicleForm from '../components/VehicleForm.jsx';
import { BikeIcon, CarIcon } from '../components/VehicleIcons.jsx';
import useVehicles from '../hooks/useVehicles.js';
import useToast from '../hooks/useToast.js';
import { errorText, parkingText } from '../utils/booking';

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicles, loaded, refresh, selected, select } = useVehicles();
  const [toast, showToast] = useToast();
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind: 'unbook' | 'remove', vehicle }
  const [busy, setBusy] = useState(false);

  const openBuilding = (p) => {
    sessionStorage.setItem(`building:${p.buildingId}`, p.buildingName);
    navigate(`/buildings/${p.buildingId}/slots`, { state: { name: p.buildingName } });
  };

  const runConfirmed = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    const { kind, vehicle } = confirm;
    try {
      if (kind === 'unbook') {
        await API.patch(`/bookings/${vehicle.parking.bookingId}/end`);
        showToast(`${vehicle.name} is no longer parked.`, 'success');
      } else {
        await API.delete(`/vehicles/${vehicle.id}`);
        if (selected?.id === vehicle.id) select(null);
        showToast(`${vehicle.name} was removed.`, 'success');
      }
    } catch (err) {
      showToast(errorText(err, 'Something went wrong. Try again.'), 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
      refresh();
    }
  };

  return (
    <div className="page">
      <Header />
      <Toast toast={toast} />

      <main className="content content-narrow">
        <BackButton onClick={() => navigate('/buildings')}>All buildings</BackButton>

        <div className="list-head">
          <div>
            <h1>My vehicles</h1>
            <p className="muted">Add your cars and bikes, then pick the one you are driving today.</p>
          </div>
          {!adding && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              Add a vehicle
            </button>
          )}
        </div>

        {adding && (
          <section className="info-card vehicle-add">
            <h2>Add a vehicle</h2>
            <VehicleForm
              onAdded={(v) => {
                setAdding(false);
                refresh();
                if (!selected) select(v.id);
                showToast(`${v.name} was added.`, 'success');
              }}
              onCancel={() => setAdding(false)}
            />
          </section>
        )}

        {!loaded && <p className="state-msg" role="status">Loading your vehicles</p>}

        {loaded && vehicles.length === 0 && !adding && (
          <div className="state-box">
            <h2>No vehicles yet</h2>
            <p>Add the car or bike you drive. You need one to book a bay.</p>
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              Add your first vehicle
            </button>
          </div>
        )}

        <ul className="vehicle-list">
          {vehicles.map((v) => (
            <li key={v.id} className={v.id === selected?.id ? 'vehicle-card is-selected' : 'vehicle-card'}>
              <span className={`vehicle-icon ${v.type}`}>
                {v.type === 'car' ? <CarIcon /> : <BikeIcon />}
              </span>
              <div className="vehicle-card-body">
                <div className="vehicle-card-title">
                  <strong>{v.name}</strong>
                  <span className="vehicle-number">{v.number}</span>
                  {v.id === selected?.id && <span className="chip chip-green">Driving today</span>}
                </div>
                <p className={v.parking ? 'vehicle-status parked' : 'vehicle-status'}>{parkingText(v)}</p>
              </div>
              <div className="vehicle-card-actions">
                {v.id !== selected?.id && (
                  <button type="button" className="btn btn-ghost" onClick={() => select(v.id)}>
                    Drive this today
                  </button>
                )}
                {v.parking ? (
                  <>
                    <button type="button" className="btn btn-ghost" onClick={() => openBuilding(v.parking)}>
                      Open building
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setConfirm({ kind: 'unbook', vehicle: v })}>
                      Unbook
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirm({ kind: 'remove', vehicle: v })}>
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'unbook' ? `End ${confirm.vehicle.name}'s parking?` : `Remove ${confirm.vehicle.name}?`}
          body={
            confirm.kind === 'unbook'
              ? `The bay at ${confirm.vehicle.parking.buildingName} will be free for other drivers straight away.`
              : 'It will disappear from your list. Past bookings are kept.'
          }
          confirmLabel={confirm.kind === 'unbook' ? 'Yes, unbook' : 'Yes, remove'}
          cancelLabel="Cancel"
          danger
          busy={busy}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
