import { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function BuildingList() {
  const [buildings, setBuildings] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();

  const fetchNearby = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        API.get(`/buildings/nearby?lat=${latitude}&lng=${longitude}&radiusKm=4`)
          .then((res) => setBuildings(res.data));
      },
      () => setLocationError('Could not fetch location, search manually below')
    );
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  const handleSearch = () => {
    if (!searchCity.trim()) return;
    API.get(`/buildings?city=${searchCity}`).then((res) => setBuildings(res.data));
  };

  return (
    <div className="building-list">
      <h2>Select a Building</h2>

      <div className="search-bar">
        <input
          placeholder="Search by city"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {locationError && <p className="error">{locationError}</p>}

      {buildings.map((b) => (
        <div key={b.id} className="building-card" onClick={() => navigate(`/buildings/${b.id}/slots`)}>
          <p className="building-name">{b.name}</p>
          <p className="building-city">{b.city}</p>
        </div>
      ))}
    </div>
  );
}

export default BuildingList;