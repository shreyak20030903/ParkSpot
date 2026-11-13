import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import BuildingMap from '../components/BuildingMap.jsx';
import VehicleChip from '../components/VehicleChip.jsx';
import VehiclePicker from '../components/VehiclePicker.jsx';
import { BuildingPhoto } from '../components/BuildingArt.jsx';
import useActiveBookings from '../hooks/useActiveBookings.js';
import useToast from '../hooks/useToast.js';
import useVehicles from '../hooks/useVehicles.js';
import { formatRupees, formatWhen, metaOf } from '../utils/booking';

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const cardRefs = useRef({});
  const { bookings } = useActiveBookings();
  const { vehicles, loaded: vehiclesLoaded, refresh: refreshVehicles, selected: vehicle, select } = useVehicles();
  const [toast] = useToast();

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

  const goToBooking = (b) => {
    if (!b?.buildingId) return;
    if (b.buildingName) sessionStorage.setItem(`building:${b.buildingId}`, b.buildingName);
    navigate(`/buildings/${b.buildingId}/slots`, { state: { name: b.buildingName } });
  };

  const isCity = (c) => mode === 'city' && city.toLowerCase() === c.toLowerCase();

  return (
    <div className="page">
      <Header />
      <Toast toast={toast} />

      <main className="content content-wide">
        {bookings.map((b) => (
          <section className="booking-banner" key={b.id} aria-live="polite">
            <div>
              <h2>
                {b.vehicleName ? `${b.vehicleName} is parked` : 'A vehicle is parked'}
                {b.buildingName ? ` at ${b.buildingName}` : ''}
              </h2>
              <p>
                {b.vehicleNumber ? `${b.vehicleNumber}. ` : ''}Bay {b.slotCode}
                {b.floorLabel ? `, ${b.floorLabel}` : ''}
                {b.endTime ? `. Booked until ${formatWhen(b.endTime)}.` : '.'}
              </p>
            </div>
            {b.buildingId && (
              <button type="button" className="btn btn-primary" onClick={() => goToBooking(b)}>
                Open building
              </button>
            )}
          </section>
        ))}

        {vehiclesLoaded && vehicles.length === 0 && (
          <section className="info-card suggestion vehicle-prompt">
            <div>
              <h2>Add your car or bike</h2>
              <p>You need a vehicle to book a bay. It takes a few seconds.</p>
            </div>
            <div className="banner-actions">
              <button type="button" className="btn btn-accent" onClick={() => setPickerOpen(true)}>
                Add a vehicle
              </button>
            </div>
          </section>
        )}

        {vehiclesLoaded && vehicles.length > 0 && !vehicle && (
          <section className="info-card suggestion vehicle-prompt">
            <div>
              <h2>Which vehicle are you driving today?</h2>
              <p>Choose one so we show the right bays when you book.</p>
            </div>
            <div className="banner-actions">
              <button type="button" className="btn btn-accent" onClick={() => setPickerOpen(true)}>
                Choose vehicle
              </button>
            </div>
          </section>
        )}

        {vehicle && (
          <div className="vehicle-strip">
            <VehicleChip vehicle={vehicle} onClick={() => setPickerOpen(true)} />
          </div>
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
                          {typeof b.carShortStay === 'number' && (
                            <span className="bcard-price">
                              {meta.layout === 'basement'
                                ? `Per visit: car ${formatRupees(b.carShortStay)}, bike ${formatRupees(b.bikeShortStay)}.`
                                : `Under a day: car ${formatRupees(b.carShortStay)}, bike ${formatRupees(b.bikeShortStay)}. Longer: car ${formatRupees(b.carPerDay)} a day.`}
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

      {pickerOpen && (
        <VehiclePicker
          vehicles={vehicles}
          selectedId={vehicle?.id}
          onSelect={select}
          onAdded={(v) => { refreshVehicles(); select(v.id); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
