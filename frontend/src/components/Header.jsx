import { useNavigate } from 'react-router-dom';

export default function Header({ hasActiveBooking, onBlocked, children }) {
  const navigate = useNavigate();

  const logout = () => {
    if (hasActiveBooking) {
      onBlocked('Unbook your slot before logging out.');
      return;
    }
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">P</span>
        <span className="brand-name">ParkSpot</span>
      </div>
      <div className="header-right">
        {children}
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
