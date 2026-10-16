import { useCallback, useEffect, useState } from 'react';
import API from '../api';
import { normalizeBooking } from '../utils/booking';

// The backend answers 400 "No active booking found" when there is none,
// so any failure here simply means "no active booking".
export default function useActiveBooking() {
  const [booking, setBooking] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await API.get('/bookings/active');
      setBooking(normalizeBooking(res.data));
    } catch {
      setBooking(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { booking, setBooking, refresh, loaded };
}
