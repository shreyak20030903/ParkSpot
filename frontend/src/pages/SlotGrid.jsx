import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import BackButton from '../components/BackButton.jsx';
import BasementMap from '../components/BasementMap.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import VehicleChip from '../components/VehicleChip.jsx';
import VehiclePicker from '../components/VehiclePicker.jsx';
import { BuildingPhoto } from '../components/BuildingArt.jsx';
import useActiveBookings from '../hooks/useActiveBookings.js';
import useBuildingSocket from '../hooks/useBuildingSocket.js';
import useToast from '../hooks/useToast.js';
import useVehicles from '../hooks/useVehicles.js';
import {
  FLOOR_LABEL,
  PRICE,
  errorText,
  formatWhen,
  metaOf,
  normalizeBooking,
  slotNumber,
} from '../utils/booking';

export default function SlotGrid() {
  const { buildingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [browseType, setBrowseType] = useState('car'); // only used while no vehicle is chosen
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [slotToBook, setSlotToBook] = useState(null);
  const [confirmUnbook, setConfirmUnbook] = useState(false);
  const [unbooking, setUnbooking] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const busy = useRef(false);

  const { vehicles, refresh: refreshVehicles, selected: vehicle, select } = useVehicles();
  const { bookings, setBookings, refresh: refreshBookings } = useActiveBookings();
  const [toast, showToast] = useToast();

  // The vehicle being driven decides which bays are shown
  const vehicleType = vehicle ? vehicle.type : browseType;
  // Is this vehicle parked somewhere right now (here or in another building)?
  const booking = vehicle ? bookings.find((b) => b.vehicleId === vehicle.id) || null : null;

  // Name, type, photo and floors of this building
  useEffect(() => {
    let alive = true;
    API.get(`/buildings/${buildingId}`)
      .then((res) => alive && setBuilding(res.data))
      .catch(() => {});
    return () => { alive = false; };
  }, [buildingId]);

  const buildingName =
    building?.name || location.state?.name || sessionStorage.getItem(`building:${buildingId}`) || 'Parking';
  const type = building?.type || 'mall';
  const meta = metaOf(type);
  const layout = meta.layout;
  const floorLabel =
    building?.floors?.find((f) => f.vehicleType === vehicleType)?.label || FLOOR_LABEL[vehicleType];
  const vehicleWord = vehicleType === 'car' ? 'cars' : 'bikes';

  const fetchSlots = useCallback(async () => {
    try {
      const res = await API.get(`/buildings/${buildingId}/slots`, { params: { vehicleType } });
      setSlots(res.data);
      setLoadError('');
    } catch {
      setLoadError('Could not load the bays. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [buildingId, vehicleType]);

  const refreshAll = useCallback(() => {
    fetchSlots();
    refreshBookings();
    refreshVehicles();
  }, [fetchSlots, refreshBookings, refreshVehicles]);

  useEffect(() => {
    setLoading(true);
    fetchSlots();
  }, [fetchSlots]);

  // Live updates over WebSocket, with a slow poll as a fallback
  const live = useBuildingSocket(buildingId, refreshAll);
  const refreshRef = useRef(refreshAll);
  refreshRef.current = refreshAll;
  useEffect(() => {
    if (live) return undefined;
    const timer = setInterval(() => refreshRef.current(), 10000);
    return () => clearInterval(timer);
  }, [live]);

  const freeCount = slots.filter((s) => s.status === 'free').length;

  // "Park here": the free bay closest to the entry (lowest bay number)
  const suggested = useMemo(() => {
    if (booking || !vehicle) return null;
    const free = slots.filter((s) => s.status === 'free');
    if (free.length === 0) return null;
    return free.reduce((best, s) => (slotNumber(s.slotCode) < slotNumber(best.slotCode) ? s : best));
  }, [slots, booking, vehicle]);

  const sameBuilding = booking?.buildingId && String(booking.buildingId) === String(buildingId);
  const mySlotId = sameBuilding ? booking.slotId : null;

  const onSelect = (slot) => {
    if (!vehicle) {
      setPickerOpen(true);
      showToast('Choose the vehicle you are driving first.', 'error');
      return;
    }
    if (booking && booking.slotId === slot.id) {
      setConfirmUnbook(true);
      return;
    }
    if (booking) {
      const where = sameBuilding ? 'here' : `at ${booking.buildingName}`;
      showToast(`${vehicle.name} is already parked ${where}. Unbook it or choose another vehicle.`, 'error');
      return;
    }
    if (slot.status === 'free') setSlotToBook(slot);
  };

  const bookSlot = async (durationMinutes) => {
    if (busy.current || !slotToBook || !vehicle) return;
    busy.current = true;
    const slot = slotToBook;
    try {
      const res = await API.post('/bookings', null, {
        params: { slotId: slot.id, vehicleId: vehicle.id, durationMinutes },
      });
      const made = normalizeBooking(res.data);
      setBookings((prev) => [...prev.filter((b) => b.vehicleId !== vehicle.id), made]);
      showToast(`${vehicle.name} is booked into bay ${slot.slotCode}.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'Booking failed. Try another bay.'), 'error');
    } finally {
      busy.current = false;
      setSlotToBook(null);
      refreshAll();
    }
  };

  const unbook = async () => {
    if (busy.current || !booking) return;
    busy.current = true;
    setUnbooking(true);
    try {
      await API.patch(`/bookings/${booking.id}/end`);
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      showToast('Booking ended. The bay is free again.', 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not unbook. Try again.'), 'error');
    } finally {
      busy.current = false;
      setUnbooking(false);
      setConfirmUnbook(false);
      refreshAll();
    }
  };

  const goToBookedBuilding = () => {
    if (booking.buildingName) {
      sessionStorage.setItem(`building:${booking.buildingId}`, booking.buildingName);
    }
    navigate(`/buildings/${booking.buildingId}/slots`, { state: { name: booking.buildingName } });
  };

  const freePercent = slots.length ? Math.round((freeCount / slots.length) * 100) : 0;
  const hasSlots = !loading && !loadError && slots.length > 0;
  const entryWord = layout === 'open' ? 'entry gate' : 'entry ramp';

  return (
    <div className="page">
      <Header>
        <span className={live ? 'live-badge live' : 'live-badge'} role="status">
          <span className="live-dot" aria-hidden="true" />
          <span className="live-text">{live ? 'Live' : 'Reconnecting'}</span>
        </span>
      </Header>
      <Toast toast={toast} />

      <main className="content">
        <BackButton onClick={() => navigate('/buildings')}>All buildings</BackButton>

        <div className="slot-head">
          <BuildingPhoto
            building={{ name: buildingName, type, imageUrl: building?.imageUrl }}
            className="slot-photo"
          />
          <div className="slot-title">
            <h1>{buildingName}</h1>
            <p className="muted">
              {meta.label} in {building?.city || 'the city'}. {floorLabel}, {layout === 'basement' ? 'underground' : 'open air'}, {vehicleWord} only.
            </p>
          </div>
          {vehicle ? (
            <VehicleChip vehicle={vehicle} onClick={() => setPickerOpen(true)} />
          ) : (
            <div className="segmented" role="group" aria-label="Vehicle type">
              <button
                type="button"
                aria-pressed={browseType === 'car'}
                className={browseType === 'car' ? 'seg active' : 'seg'}
                onClick={() => setBrowseType('car')}
              >
                Car
              </button>
              <button
                type="button"
                aria-pressed={browseType === 'bike'}
                className={browseType === 'bike' ? 'seg active' : 'seg'}
                onClick={() => setBrowseType('bike')}
              >
                Bike
              </button>
            </div>
          )}
        </div>

        <div className="info-strip">
          <section className="info-card availability">
            <h2 className="card-title">Availability</h2>
            {hasSlots ? (
              <>
                <p className="avail-line"><strong>{freeCount}</strong> of {slots.length} bays free</p>
                <span className="meter" aria-hidden="true">
                  <span className="meter-fill" style={{ width: `${freePercent}%` }} />
                </span>
              </>
            ) : (
              <p className="muted">{loading ? 'Loading bays' : 'No bays to show'}</p>
            )}
          </section>

          {!vehicle && (
            <section className="info-card suggestion">
              <div>
                <h2>Which vehicle are you driving today?</h2>
                <p>
                  {vehicles.length === 0
                    ? 'Add your car or bike to book a bay.'
                    : 'Choose one to book a bay. You can still look around without one.'}
                </p>
              </div>
              <div className="banner-actions">
                <button type="button" className="btn btn-accent" onClick={() => setPickerOpen(true)}>
                  {vehicles.length === 0 ? 'Add a vehicle' : 'Choose vehicle'}
                </button>
              </div>
            </section>
          )}

          {vehicle && booking && (
            <section className="info-card booking-banner" aria-live="polite">
              <div>
                <h2>{sameBuilding ? 'Active parking in this building' : `${vehicle.name} is parked at ${booking.buildingName}`}</h2>
                <p>
                  {vehicle.name}, {vehicle.number}. Bay {booking.slotCode}
                  {booking.floorLabel ? `, ${booking.floorLabel}` : ''}
                  {booking.endTime ? `. Booked until ${formatWhen(booking.endTime)}.` : '.'}
                </p>
              </div>
              <div className="banner-actions">
                {booking.buildingId && !sameBuilding && (
                  <button type="button" className="btn btn-ghost" onClick={goToBookedBuilding}>
                    Open that building
                  </button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => setPickerOpen(true)}>
                  Choose another vehicle
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setConfirmUnbook(true)}>
                  Unbook
                </button>
              </div>
            </section>
          )}

          {vehicle && !booking && suggested && (
            <section className="info-card suggestion" aria-live="polite">
              <div>
                <h2>Park here: bay {suggested.slotCode}</h2>
                <p>The free bay closest to the {entryWord}. This updates as other vehicles take bays.</p>
              </div>
              <div className="banner-actions">
                <button type="button" className="btn btn-accent" onClick={() => setSlotToBook(suggested)}>
                  Book bay {suggested.slotCode}
                </button>
              </div>
            </section>
          )}

          {vehicle && !booking && hasSlots && !suggested && (
            <section className="info-card suggestion suggestion-full" aria-live="polite">
              <div>
                <h2>This parking is full right now</h2>
                <p>The page updates by itself when a bay frees up.</p>
              </div>
            </section>
          )}

          <section className="info-card legend-card">
            <h2 className="card-title">Bay colours</h2>
            <ul className="legend" aria-label="Bay colours">
              <li><span className="swatch swatch-free" />Free</li>
              <li><span className="swatch swatch-booked" />Taken, with when it frees up</li>
              <li><span className="swatch swatch-mine" />Your bay</li>
              <li><span className="swatch swatch-suggested" />Suggested</li>
            </ul>
          </section>
        </div>

        <section className="map-col">
          {loading && <p className="state-msg" role="status">Loading bays</p>}
          {loadError && (
            <div className="state-box">
              <h2>{loadError}</h2>
              <button type="button" className="btn btn-ghost" onClick={fetchSlots}>Try again</button>
            </div>
          )}
          {!loading && !loadError && slots.length === 0 && (
            <div className="state-box">
              <h2>No {vehicleType} bays in this building</h2>
            </div>
          )}
          {hasSlots && (
            <BasementMap
              slots={slots}
              vehicleType={vehicleType}
              mySlotId={mySlotId}
              suggestedId={suggested?.id}
              onSelect={onSelect}
              layout={layout}
            />
          )}
        </section>
      </main>

      {slotToBook && (
        <PaymentModal
          slot={slotToBook}
          buildingId={buildingId}
          vehicle={vehicle}
          vehicleType={vehicleType}
          floorLabel={floorLabel}
          buildingName={buildingName}
          fallbackPrice={PRICE[vehicleType]}
          onClose={() => setSlotToBook(null)}
          onPaid={bookSlot}
        />
      )}

      {pickerOpen && (
        <VehiclePicker
          vehicles={vehicles}
          selectedId={vehicle?.id}
          onSelect={select}
          onAdded={(v) => { refreshVehicles(); select(v.id); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {confirmUnbook && (
        <ConfirmDialog
          title="Unbook this bay?"
          body={`Bay ${booking?.slotCode ?? ''} will be free for other drivers straight away.`}
          confirmLabel="Yes, unbook"
          cancelLabel="Keep it"
          danger
          busy={unbooking}
          onConfirm={unbook}
          onCancel={() => setConfirmUnbook(false)}
        />
      )}
    </div>
  );
}
