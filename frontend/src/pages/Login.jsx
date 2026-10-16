import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import API from '../api';
import heroImg from '../assets/basement-city.svg';
import { errorText } from '../utils/booking';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', passwordHash: '', phone: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem('token')) {
    return <Navigate to="/buildings" replace />;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (isRegister) {
        await API.post('/auth/register', form);
        setIsRegister(false);
        setForm({ ...form, passwordHash: '' });
        setNotice('Account created. Log in to continue.');
      } else {
        const res = await API.post('/auth/login', {
          email: form.email,
          passwordHash: form.passwordHash,
        });
        localStorage.setItem('token', res.data.token);
        navigate('/buildings', { replace: true });
      }
    } catch (err) {
      setError(errorText(err, 'Could not reach the server. Check that the backend is running.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <img
          src={heroImg}
          alt="Cutaway of a mall with two basement parking levels. Cars fill most bays and one free bay is marked Park here."
        />
        <div className="auth-hero-copy">
          <h1>Know where to park before you arrive</h1>
          <p>
            See free bays in nearby malls and offices, book one, and find your car again when
            you come back.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="brand brand-dark">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">ParkSpot</span>
          </div>
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label className="field">
                  <span>Full name</span>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    title="10 digit mobile number"
                    required
                  />
                </label>
              </>
            )}
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="passwordHash"
                type="password"
                value={form.passwordHash}
                onChange={handleChange}
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </label>

            {notice && <p className="form-notice" role="status">{notice}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Please wait' : isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="switch-mode">
            {isRegister ? 'Already have an account?' : 'New to ParkSpot?'}{' '}
            <button type="button" className="link-button" onClick={switchMode}>
              {isRegister ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
