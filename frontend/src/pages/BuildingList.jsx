import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import BuildingMap from '../components/BuildingMap.jsx';
import { BuildingPhoto } from '../components/BuildingArt.jsx';
import useActiveBooking from '../hooks/useActiveBooking.js';
import useToast from '../hooks/useToast.js';
import { formatRupees, formatTime, metaOf } from '../utils/booking';

const CITIES = ['Indore', 'Pune', 'Mumbai', 'Delhi'];

function sortNearestFirst(list) {
  if (!list.every((b) => typeof b.distanceKm === 'number')) return list;
  return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
}

export default function BuildingList() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [mode, setMode] = useState('nearby'); // nearby | city
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('locating'); // locating | ready | denied | error
  const [query, setQuery] = useState('');
  const [userPos, setUserPos] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const cardRefs = useRef({});
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
          setUserPos({ lat: latitude, lng: longitude });
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
    const name = text.trim();
    if (!name) {
      loadNearby();
      return;
    }
    setMode('city');
    setCity(name);
    setStatus('locating');
    try {
      const res = await API.get('/buildings', { params: { city: name } });
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

  const pickFromMap = (id) => {
    setActiveId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const goToBooking = () => {
    if (!booking?.buildingId) return;
    if (booking.buildingName) sessionStorage.setItem(`building:${booking.buildingId}`, booking.buildingName);
    navigate(`/buildings/${booking.buildingId}/slots`, { state: { name: booking.buildingName } });
  };

  const isCity = (c) => mode === 'city' && city.toLowerCase() === c.toLowerCase();

  return (
    <div className="page">
      <Header hasActiveBooking={!!booking} onBlocked={(m) => showToast(m, 'error')} />
      <Toast toast={toast} />

      <main className="content content-wide">
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
            <h1>{mode === 'nearby' ? 'Parking near you' : `Parking in ${city}`}</h1>
            <p className="muted">
              {mode === 'nearby'
                ? 'Buildings within 4 km, nearest first.'
                : 'Malls, airports and railway stations.'}
            </p>
          </div>
          <form className="search" onSubmit={onSubmit} role="search">
            <label className="visually-hidden" htmlFor="city">Search by city</label>
            <input
              id="city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>

        <div className="city-chips" role="group" aria-label="Pick a place">
          <button
            type="button"
            aria-pressed={mode === 'nearby'}
            className={mode === 'nearby' ? 'city-chip active' : 'city-chip'}
            onClick={() => { setQuery(''); loadNearby(); }}
          >
            Near me
          </button>
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={isCity(c)}
              className={isCity(c) ? 'city-chip active' : 'city-chip'}
              onClick={() => { setQuery(''); searchCity(c); }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="explore">
          <div className="explore-list">
            {status === 'locating' && <p className="state-msg" role="status">Finding parking</p>}

            {status === 'denied' && (
              <div className="state-box">
                <h2>We could not get your location</h2>
                <p>Allow location access for nearby parking, or pick a city above.</p>
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
                <h2>
                  {mode === 'nearby'
                    ? 'No parking buildings within 4 km of you.'
                    : `No parking buildings found in ${city}.`}
                </h2>
                <p>Pick one of the cities above to see its parking.</p>
              </div>
            )}

            {status === 'ready' && buildings.length > 0 && (
              <ul className="bcard-list">
                {buildings.map((b, i) => {
                  const meta = metaOf(b.type);
                  const hasCounts = typeof b.freeSlots === 'number' && typeof b.totalSlots === 'number';
                  const ratio = hasCounts && b.totalSlots > 0 ? b.freeSlots / b.totalSlots : 0;
                  const nearest = mode === 'nearby' && i === 0 && typeof b.distanceKm === 'number';
                  return (
                    <li key={b.id} ref={(el) => { cardRefs.current[b.id] = el; }}>
                      <button
                        type="button"
                        className={activeId === b.id ? 'bcard is-active' : 'bcard'}
                        onClick={() => open(b)}
                        onMouseEnter={() => setActiveId(b.id)}
                        onFocus={() => setActiveId(b.id)}
                      >
                        <BuildingPhoto building={b} className="bcard-photo" />
                        <span className="bcard-body">
                          <span className="bcard-title">
                            {b.name}
                            {nearest && <span className="chip chip-yellow">Nearest</span>}
                          </span>
                          <span className="bcard-tags">
                            <span className="tag" style={{ '--tag': meta.color }}>{meta.label}</span>
                            <span className="tag tag-plain">
                              {meta.layout === 'basement' ? 'Underground' : 'Open air'}
                            </span>
                            <span className="bcard-city">{b.city}</span>
                          </span>
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
                          {typeof b.carPerHour === 'number' && (
                            <span className="bcard-price">
                              Car {formatRupees(b.carPerHour)} an hour, bike {formatRupees(b.bikePerHour)} an hour
                            </span>
                          )}
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
          </div>

          <div className="explore-map">
            <BuildingMap
              buildings={status === 'ready' ? buildings : []}
              userPos={userPos}
              activeId={activeId}
              onActive={pickFromMap}
              onOpen={open}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
