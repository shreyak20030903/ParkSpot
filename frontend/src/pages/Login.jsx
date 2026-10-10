import { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', passwordHash: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await API.post('/auth/register', form);
        setIsRegister(false); // after registering, show the login form
      } else {
        const res = await API.post('/auth/login', form);
        localStorage.setItem('userId', res.data.id); // simple demo auth, no JWT yet
        navigate('/buildings');
      }
    } catch (err) {
      setError('Something went wrong, check details');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <input name="name" placeholder="Name" onChange={handleChange} required />
            <input name="phone" placeholder="Phone" onChange={handleChange} required />
          </>
        )}
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="passwordHash" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p onClick={() => setIsRegister(!isRegister)} className="toggle-link">
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
      </p>
    </div>
  );
}

export default Login;
