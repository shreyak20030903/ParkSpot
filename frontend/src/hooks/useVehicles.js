import { useCallback, useEffect, useState } from 'react';
import API from '../api';

const KEY = 'vehicleId';

// The user's vehicles and which one they are driving today (remembered in the browser).
export default function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(KEY));

  const select = useCallback((id) => {
    setSelectedId(id);
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await API.get('/vehicles');
      setVehicles(res.data);
    } catch {
      setVehicles([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep the choice valid. With a single vehicle there is nothing to choose.
  useEffect(() => {
    if (!loaded) return;
    const valid = vehicles.some((v) => v.id === selectedId);
    if (valid) return;
    if (vehicles.length === 1) select(vehicles[0].id);
    else if (selectedId) select(null);
  }, [loaded, vehicles, selectedId, select]);

  const selected = vehicles.find((v) => v.id === selectedId) || null;
  return { vehicles, loaded, refresh, selected, select };
}
