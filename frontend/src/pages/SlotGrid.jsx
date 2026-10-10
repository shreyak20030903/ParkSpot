import { useEffect, useState, useRef } from 'react';
import API from '../api';
import { useParams,useNavigate } from 'react-router-dom';


function SlotGrid() {
  const { buildingId } = useParams();
  const [vehicleType, setVehicleType] = useState('car');
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [myBooking, setMyBooking] = useState(null); // poora booking object store hoga
  const [isBooking, setIsBooking] = useState(false);
  const isBookingRef = useRef(false);
  const navigate = useNavigate();
  const floorLabel = vehicleType === 'car' ? 'Basement 1 (B1)' : 'Basement 2 (B2)';

  const userId = localStorage.getItem('userId');

  const fetchSlots = () => {
    API.get(`/buildings/${buildingId}/slots?vehicleType=${vehicleType}`).then((res) =>
      setSlots(res.data)
    );
  };

 const fetchMyActiveBooking = () => {
  API.get(`/bookings/active?userId=${userId}`)
    .then((res) => {
      console.log('Active booking found:', res.data);
      setMyBooking(res.data);
    })
    .catch((err) => {
      console.log('No active booking:', err.response?.status, err.response?.data);
      setMyBooking(null);
    });
};



const handleLogout = () => {
  if (myBooking) {
    setMessage('Please unbook your slot before logging out');
    return;
  }
  localStorage.removeItem('userId');
  navigate('/');
};
 
  useEffect(() => {
    fetchSlots();
    fetchMyActiveBooking();
  }, [buildingId, vehicleType]);

  const handleBookClick = async (slot) => {
  if (isBookingRef.current || myBooking || slot.status !== 'free') return;

  const price = vehicleType === 'car' ? 40 : 30;
  const confirmed = window.confirm(`Pay ₹${price} to book slot ${slot.slotCode}?`);
  if (!confirmed) return;

  isBookingRef.current = true;
  setIsBooking(true);
  setMessage('Processing payment...');

    try {
      const res = await API.post(
        `/bookings?slotId=${slot.id}&userId=${userId}&vehicleTypeId=1&durationMinutes=120`
      );
      setMyBooking(res.data);
      setMessage('Slot booked');
      fetchSlots();
    } catch (err) {
      try {
        const activeRes = await API.get(`/bookings/active?userId=${userId}`);
        setMyBooking(activeRes.data);
        setMessage('Slot booked');
      } catch {
        setMyBooking(null);
        const errData = err.response?.data;
        setMessage(typeof errData === 'string' ? errData : 'Booking failed, slot may already be taken');
      }
      fetchSlots();
    } finally {
      isBookingRef.current = false;
      setIsBooking(false);
    }
  };

  const handleUnbookClick = async () => {
    if (isBookingRef.current || !myBooking) return;

    const confirmed = window.confirm('Are you sure you want to unbook this slot?');
    if (!confirmed) return;

    isBookingRef.current = true;
    setIsBooking(true);
    try {
      await API.patch(`/bookings/${myBooking.id}/end`);
      setMyBooking(null);
      setMessage('Slot is free now');
      fetchSlots();
    } catch (err) {
      setMessage('Could not unbook, try again');
    } finally {
      isBookingRef.current = false;
      setIsBooking(false);
    }
  };

  const handleSlotClick = (slot) => {
    const isMine = myBooking && myBooking.slot.id === slot.id;
    if (isMine) {
      handleUnbookClick();
    } else {
      handleBookClick(slot);
    }
  };

  return (
    <div className="slot-grid-page">
      
      <div className="top-bar">
          <div className="vehicle-toggle">
              <button onClick={() => setVehicleType('bike')} className={vehicleType === 'bike' ? 'active' : ''}>Bike</button>
               <button onClick={() => setVehicleType('car')} className={vehicleType === 'car' ? 'active' : ''}>Car</button>
               <p className="current-floor-label">{floorLabel}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          
      </div>
      

      {myBooking && (
        <div className="my-booking-banner">
          <p>Active booking: {myBooking.slot.slotCode}</p>
          <button onClick={handleUnbookClick}>Unbook</button>
        </div>
      )}

      {message && <p className="message">{message}</p>}

      <div className="slot-grid">
        {slots.map((slot) => {
          const isMine = myBooking && myBooking.slot.id === slot.id;
          return (
            <div
              key={slot.id}
              className={`slot-box ${isMine ? 'mine' : slot.status}`}
              onClick={() => handleSlotClick(slot)}
            >
              {slot.slotCode}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SlotGrid;