import { useCallback, useEffect, useState } from 'react';
import API from '../api';
import { normalizeBooking } from '../utils/booking';

// Every vehicle of the user that is parked right now. An empty list means nothing is parked.
export default function useActiveBookings() {
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await API.get('/bookings/active');
      const list = Array.isArray(res.data) ? res.data : [];
      setBookings(list.map(normalizeBooking));
    } catch {
      setBookings([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bookings, setBookings, refresh, loaded };
}
