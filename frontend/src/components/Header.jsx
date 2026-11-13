import { Link, useNavigate } from 'react-router-dom';

export default function Header({ children }) {
  const navigate = useNavigate();

  // Parked vehicles stay booked on the account, so logging out is always allowed
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vehicleId');
    navigate('/', { replace: true });
  };

  return (
    <header className="app-header">
      <Link to="/buildings" className="brand brand-link">
        <span className="brand-mark" aria-hidden="true">P</span>
        <span className="brand-name">ParkSpot</span>
      </Link>
      <div className="header-right">
        {children}
        <Link to="/vehicles" className="btn btn-ghost">My vehicles</Link>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
