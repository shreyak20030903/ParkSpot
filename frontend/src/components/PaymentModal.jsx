import { useEffect, useRef, useState } from 'react';
import API from '../api';
import { formatRupees } from '../utils/booking';

// Used only if the pricing endpoint is not available
const FALLBACK_OPTIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
];

// Demo checkout: nothing typed here leaves the browser and no money moves.
// The booking request is only sent after this "payment" succeeds.
export default function PaymentModal({
  slot,
  buildingId,
  vehicleType,
  floorLabel,
  buildingName,
  fallbackPrice,
  onClose,
  onPaid,
}) {
  const [options, setOptions] = useState(null); // null while loading
  const [minutes, setMinutes] = useState(null);
  const [method, setMethod] = useState('upi');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '' });
  const [step, setStep] = useState('form'); // form | processing | success
  const [error, setError] = useState('');
  const timers = useRef([]);

  // Prices come from the server, so the screen always shows what will be charged
  useEffect(() => {
    let alive = true;
    API.get(`/buildings/${buildingId}/pricing`, { params: { vehicleType } })
      .then((res) => {
        if (!alive) return;
        setOptions(res.data);
        const pick = res.data.find((o) => o.minutes >= 120) || res.data[0];
        setMinutes(pick ? pick.minutes : null);
      })
      .catch(() => {
        if (!alive) return;
        setOptions(FALLBACK_OPTIONS.map((o) => ({ ...o, price: fallbackPrice })));
        setMinutes(120);
      });
    return () => { alive = false; };
  }, [buildingId, vehicleType, fallbackPrice]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && step === 'form') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const selected = options?.find((o) => o.minutes === minutes);
  const price = selected?.price;
  const days = selected ? selected.minutes / 1440 : 0;

  const validate = () => {
    if (method === 'upi') {
      return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim()) ? '' : 'Enter a UPI id like name@bank.';
    }
    if (!/^\d{16}$/.test(card.number.replace(/\s/g, ''))) return 'Enter a 16 digit card number.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'Enter the expiry as MM/YY.';
    return '';
  };

  const pay = (e) => {
    e.preventDefault();
    if (!selected) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setStep('processing');
    timers.current.push(
      setTimeout(() => {
        setStep('success');
        timers.current.push(setTimeout(() => onPaid(minutes), 900));
      }, 1400)
    );
  };

  const locked = step !== 'form';

  return (
    <div className="modal-backdrop" onClick={() => !locked && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-title"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'form' && (
          <form onSubmit={pay} noValidate>
            <h2 id="pay-title">Pay to book bay {slot.slotCode}</h2>

            <dl className="summary">
              <div><dt>Building</dt><dd>{buildingName}</dd></div>
              <div><dt>Parking</dt><dd>{floorLabel}</dd></div>
              <div><dt>Vehicle</dt><dd>{vehicleType === 'car' ? 'Car' : 'Bike'}</dd></div>
              <div>
                <dt><label htmlFor="duration">Parking for</label></dt>
                <dd>
                  {options ? (
                    <select
                      id="duration"
                      value={minutes ?? ''}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                    >
                      {options.map((o) => (
                        <option key={o.minutes} value={o.minutes}>
                          {o.label}, {formatRupees(o.price)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="muted">Loading prices</span>
                  )}
                </dd>
              </div>
              <div className="summary-total">
                <dt>Amount</dt>
                <dd>{price != null ? formatRupees(price) : '...'}</dd>
              </div>
            </dl>
            {days >= 2 && (
              <p className="per-day">That works out to about {formatRupees(Math.round(price / days))} a day.</p>
            )}

            <div className="tabs" role="tablist" aria-label="Payment method">
              <button
                type="button"
                role="tab"
                aria-selected={method === 'upi'}
                className={method === 'upi' ? 'tab active' : 'tab'}
                onClick={() => { setMethod('upi'); setError(''); }}
              >
                UPI
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === 'card'}
                className={method === 'card' ? 'tab active' : 'tab'}
                onClick={() => { setMethod('card'); setError(''); }}
              >
                Card
              </button>
            </div>

            {method === 'upi' ? (
              <label className="field">
                <span>UPI id</span>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="name@bank"
                  autoComplete="off"
                />
              </label>
            ) : (
              <div className="field-row">
                <label className="field">
                  <span>Card number</span>
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="4111 1111 1111 1111"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </label>
                <label className="field field-narrow">
                  <span>Expiry</span>
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    autoComplete="off"
                  />
                </label>
              </div>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="demo-note">
              Demo checkout. No money moves and nothing you type here is sent anywhere.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-accent" disabled={!selected}>
                {price != null ? `Pay ${formatRupees(price)}` : 'Pay'}
              </button>
            </div>
          </form>
        )}

        {step === 'processing' && (
          <div className="pay-state" role="status">
            <span className="spinner" aria-hidden="true" />
            <h2 id="pay-title">Processing payment</h2>
            <p>Please do not close this window.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="pay-state" role="status">
            <span className="tick" aria-hidden="true">✓</span>
            <h2 id="pay-title">Payment received</h2>
            <p>Booking bay {slot.slotCode} for you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
