import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api';
import Header from '../components/Header.jsx';
import Toast from '../components/Toast.jsx';
import BasementMap from '../components/BasementMap.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useActiveBooking from '../hooks/useActiveBooking.js';
import useBuildingSocket from '../hooks/useBuildingSocket.js';
import useToast from '../hooks/useToast.js';
import {
  FLOOR_LABEL,
  PRICE,
  errorText,
  formatTime,
  normalizeBooking,
  slotNumber,
} from '../utils/booking';

export default function SlotGrid() {
  const { buildingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const buildingName =
    location.state?.name || sessionStorage.getItem(`building:${buildingId}`) || 'Parking';

  const [vehicleType, setVehicleType] = useState('car');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [slotToBook, setSlotToBook] = useState(null);
  const [confirmUnbook, setConfirmUnbook] = useState(false);
  const [unbooking, setUnbooking] = useState(false);
  const busy = useRef(false);

  const { booking, setBooking, refresh: refreshBooking } = useActiveBooking();
  const [toast, showToast] = useToast();

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
    refreshBooking();
  }, [fetchSlots, refreshBooking]);

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

  // "Park here": the free bay closest to the entry ramp (lowest bay number)
  const suggested = useMemo(() => {
    if (booking) return null;
    const free = slots.filter((s) => s.status === 'free');
    if (free.length === 0) return null;
    return free.reduce((best, s) => (slotNumber(s.slotCode) < slotNumber(best.slotCode) ? s : best));
  }, [slots, booking]);

  const sameBuilding =
    booking?.buildingId && String(booking.buildingId) === String(buildingId);
  const mySlotId = booking?.slotId;

  const onSelect = (slot) => {
    if (booking && booking.slotId === slot.id) {
      setConfirmUnbook(true);
      return;
    }
    if (booking) {
      showToast('You already have an active booking. Unbook it to book another bay.', 'error');
      return;
    }
    if (slot.status === 'free') setSlotToBook(slot);
  };

  const bookSlot = async (durationMinutes) => {
    if (busy.current || !slotToBook) return;
    busy.current = true;
    const slot = slotToBook;
    try {
      const res = await API.post('/bookings', null, {
        params: { slotId: slot.id, durationMinutes },
      });
      setBooking(normalizeBooking(res.data));
      showToast(`Bay ${slot.slotCode} is booked.`, 'success');
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
      setBooking(null);
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

  let bannerTitle = 'Your active parking';
  if (sameBuilding) bannerTitle = 'Active parking in this building';
  else if (booking?.buildingName) bannerTitle = `Active parking at ${booking.buildingName}`;

  const freePercent = slots.length ? Math.round((freeCount / slots.length) * 100) : 0;
  const hasSlots = !loading && !loadError && slots.length > 0;

  return (
    <div className="page">
      <Header hasActiveBooking={!!booking} onBlocked={(m) => showToast(m, 'error')}>
        <span className={live ? 'live-badge live' : 'live-badge'} role="status">
          <span className="live-dot" aria-hidden="true" />
          <span className="live-text">{live ? 'Live' : 'Reconnecting'}</span>
        </span>
      </Header>
      <Toast toast={toast} />

      <main className="content">
        <button type="button" className="link-back" onClick={() => navigate('/buildings')}>
          Back to all buildings
        </button>

        <div className="slot-head">
          <div>
            <h1>{buildingName}</h1>
            <p className="muted">
              {FLOOR_LABEL[vehicleType]} for {vehicleType === 'car' ? 'cars' : 'bikes'}
            </p>
          </div>
          <div className="segmented" role="group" aria-label="Vehicle type">
            <button
              type="button"
              aria-pressed={vehicleType === 'car'}
              className={vehicleType === 'car' ? 'seg active' : 'seg'}
              onClick={() => setVehicleType('car')}
            >
              Car
            </button>
            <button
              type="button"
              aria-pressed={vehicleType === 'bike'}
              className={vehicleType === 'bike' ? 'seg active' : 'seg'}
              onClick={() => setVehicleType('bike')}
            >
              Bike
            </button>
          </div>
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

          {booking && (
            <section className="info-card booking-banner" aria-live="polite">
              <div>
                <h2>{bannerTitle}</h2>
                <p>
                  Bay {booking.slotCode}
                  {booking.floorLabel ? `, ${booking.floorLabel}` : ''}
                  {booking.endTime ? `. Booked until ${formatTime(booking.endTime)}.` : '.'}
                </p>
              </div>
              <div className="banner-actions">
                {booking.buildingId && !sameBuilding && (
                  <button type="button" className="btn btn-ghost" onClick={goToBookedBuilding}>
                    Open that building
                  </button>
                )}
                <button type="button" className="btn btn-danger" onClick={() => setConfirmUnbook(true)}>
                  Unbook
                </button>
              </div>
            </section>
          )}

          {!booking && suggested && (
            <section className="info-card suggestion" aria-live="polite">
              <div>
                <h2>Park here: bay {suggested.slotCode}</h2>
                <p>The free bay closest to the entry ramp. This updates as other cars take bays.</p>
              </div>
              <div className="banner-actions">
                <button type="button" className="btn btn-accent" onClick={() => setSlotToBook(suggested)}>
                  Book bay {suggested.slotCode}
                </button>
              </div>
            </section>
          )}

          {!booking && hasSlots && !suggested && (
            <section className="info-card suggestion suggestion-full" aria-live="polite">
              <div>
                <h2>This basement is full right now</h2>
                <p>The page updates by itself when a bay frees up.</p>
              </div>
            </section>
          )}

          <section className="info-card legend-card">
            <h2 className="card-title">Bay colours</h2>
            <ul className="legend" aria-label="Bay colours">
              <li><span className="swatch swatch-free" />Free</li>
              <li><span className="swatch swatch-booked" />Taken, with the time it frees up</li>
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
            />
          )}
        </section>
      </main>

      {slotToBook && (
        <PaymentModal
          slot={slotToBook}
          vehicleType={vehicleType}
          floorLabel={FLOOR_LABEL[vehicleType]}
          buildingName={buildingName}
          price={PRICE[vehicleType]}
          onClose={() => setSlotToBook(null)}
          onPaid={bookSlot}
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
