import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import useActiveBooking from '../hooks/useActiveBooking.js';
import useToast from '../hooks/useToast.js';
import { formatTime } from '../utils/booking';

function BuildingGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <rect x="6" y="14" width="22" height="28" rx="2" fill="#3a6ae0" />
      <rect x="28" y="24" width="14" height="18" rx="2" fill="#7aa2ff" />
      <g fill="#f5b800">
        <rect x="10" y="19" width="4" height="4" />
        <rect x="18" y="19" width="4" height="4" />
        <rect x="10" y="27" width="4" height="4" />
        <rect x="18" y="27" width="4" height="4" />
        <rect x="32" y="29" width="4" height="4" />
      </g>
      <rect x="13" y="35" width="8" height="7" fill="#ffffff" />
    </svg>
  );
}

function sortNearestFirst(list) {
  if (!list.every((b) => typeof b.distanceKm === 'number')) return list;
  return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
}

export default function BuildingList() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [mode, setMode] = useState('nearby'); // nearby | city
  const [status, setStatus] = useState('locating'); // locating | ready | denied | error
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const { booking } = useActiveBooking();
  const [toast, showToast] = useToast();

  const loadNearby = useCallback(() => {
    setMode('nearby');
    setStatus('locating');
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await API.get('/buildings/nearby', {
            params: { lat: latitude, lng: longitude, radiusKm: 4 },
          });
          setBuildings(sortNearestFirst(res.data));
          setStatus('ready');
        } catch {
          setStatus('error');
        }
      },
      () => setStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  const searchCity = async (text) => {
    const city = text.trim();
    if (!city) {
      loadNearby();
      return;
    }
    setMode('city');
    setSearched(city);
    setStatus('locating');
    try {
      const res = await API.get('/buildings', { params: { city } });
      setBuildings(res.data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    searchCity(query);
  };

  const open = (b) => {
    sessionStorage.setItem(`building:${b.id}`, b.name);
    navigate(`/buildings/${b.id}/slots`, { state: { name: b.name } });
  };

  const goToBooking = () => {
    if (!booking?.buildingId) return;
    if (booking.buildingName) sessionStorage.setItem(`building:${booking.buildingId}`, booking.buildingName);
    navigate(`/buildings/${booking.buildingId}/slots`, { state: { name: booking.buildingName } });
  };

  const emptyMessage =
    mode === 'nearby'
      ? 'No parking buildings within 4 km of you.'
      : `No parking buildings found in ${searched}.`;

  return (
    <div className="page">
      <Header hasActiveBooking={!!booking} onBlocked={(m) => showToast(m, 'error')} />
      <Toast toast={toast} />

      <main className="content">
        {booking && (
          <section className="booking-banner" aria-live="polite">
            <div>
              <h2>
                {booking.buildingName
                  ? `Active parking at ${booking.buildingName}`
                  : 'You have an active parking'}
              </h2>
              <p>
                Bay {booking.slotCode}
                {booking.floorLabel ? `, ${booking.floorLabel}` : ''}
                {booking.endTime ? `. Booked until ${formatTime(booking.endTime)}.` : '.'}
              </p>
            </div>
            {booking.buildingId && (
              <button type="button" className="btn btn-primary" onClick={goToBooking}>
                Open building
              </button>
            )}
          </section>
        )}

        <div className="list-head">
          <div>
            <h1>{mode === 'nearby' ? 'Parking near you' : `Parking in ${searched}`}</h1>
            <p className="muted">
              {mode === 'nearby'
                ? 'Buildings within 4 km, nearest first.'
                : 'Search results by city.'}
            </p>
          </div>
          <form className="search" onSubmit={onSubmit} role="search">
            <label className="visually-hidden" htmlFor="city">Search by city</label>
            <input
              id="city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city, like Indore"
            />
            <button type="submit" className="btn btn-primary">Search</button>
            {mode === 'city' && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setQuery(''); loadNearby(); }}
              >
                Near me
              </button>
            )}
          </form>
        </div>

        {status === 'locating' && <p className="state-msg" role="status">Finding parking</p>}

        {status === 'denied' && (
          <div className="state-box">
            <h2>We could not get your location</h2>
            <p>Allow location access for nearby parking, or search for a city above.</p>
            <button type="button" className="btn btn-ghost" onClick={loadNearby}>Try again</button>
          </div>
        )}

        {status === 'error' && (
          <div className="state-box">
            <h2>Could not load buildings</h2>
            <p>Check that the backend is running, then try again.</p>
            <button type="button" className="btn btn-ghost" onClick={loadNearby}>Try again</button>
          </div>
        )}

        {status === 'ready' && buildings.length === 0 && (
          <div className="state-box">
            <h2>{emptyMessage}</h2>
            <p>Try searching a city instead.</p>
            <button type="button" className="btn btn-ghost" onClick={() => searchCity('Indore')}>
              Show buildings in Indore
            </button>
          </div>
        )}

        {status === 'ready' && buildings.length > 0 && (
          <ul className="building-grid">
            {buildings.map((b, i) => {
              const hasCounts = typeof b.freeSlots === 'number' && typeof b.totalSlots === 'number';
              const ratio = hasCounts && b.totalSlots > 0 ? b.freeSlots / b.totalSlots : 0;
              const nearest = mode === 'nearby' && i === 0 && typeof b.distanceKm === 'number';
              return (
                <li key={b.id}>
                  <button type="button" className="building-card" onClick={() => open(b)}>
                    <span className="building-glyph"><BuildingGlyph /></span>
                    <span className="building-body">
                      <span className="building-title">
                        {b.name}
                        {nearest && <span className="chip chip-yellow">Nearest</span>}
                      </span>
                      <span className="building-city">{b.city}</span>
                      <span className="chips">
                        {typeof b.distanceKm === 'number' && (
                          <span className="chip">{b.distanceKm.toFixed(1)} km away</span>
                        )}
                        {hasCounts && (
                          <span className={`chip ${b.freeSlots === 0 ? 'chip-red' : 'chip-green'}`}>
                            {b.freeSlots === 0 ? 'Full' : `${b.freeSlots} of ${b.totalSlots} bays free`}
                          </span>
                        )}
                      </span>
                      {hasCounts && (
                        <span className="meter" aria-hidden="true">
                          <span className="meter-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
