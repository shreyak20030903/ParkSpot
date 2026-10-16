import { useEffect, useRef, useState } from 'react';

const DURATIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
];

// Demo checkout: nothing typed here leaves the browser and no money moves.
// The booking request is only sent after this "payment" succeeds.
export default function PaymentModal({
  slot,
  vehicleType,
  floorLabel,
  buildingName,
  price,
  onClose,
  onPaid,
}) {
  const [method, setMethod] = useState('upi');
  const [minutes, setMinutes] = useState(120);
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '' });
  const [step, setStep] = useState('form'); // form | processing | success
  const [error, setError] = useState('');
  const timers = useRef([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && step === 'form') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
              <div><dt>Floor</dt><dd>{floorLabel}</dd></div>
              <div><dt>Vehicle</dt><dd>{vehicleType === 'car' ? 'Car' : 'Bike'}</dd></div>
              <div>
                <dt><label htmlFor="duration">Parking for</label></dt>
                <dd>
                  <select
                    id="duration"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.minutes} value={d.minutes}>{d.label}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div className="summary-total"><dt>Amount</dt><dd>₹{price}</dd></div>
            </dl>

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
              <button type="submit" className="btn btn-accent">Pay ₹{price}</button>
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
