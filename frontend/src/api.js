import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const API = axios.create({ baseURL: API_URL });

// Send the JWT with every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or invalid token comes back as 401: clear it and go to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      window.location.assign('/');
    }
    return Promise.reject(err);
  }
);

export default API;
