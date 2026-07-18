import axios from 'axios';

// CHANGE THIS IF THE BACKEND EVER MOVES OFF PORT 5001
const API_PORT = 5001;

/**
 * Resolve the API base URL from the host the page was actually loaded from.
 *
 * Hardcoding 'localhost' breaks any device that is not the dev machine: on a phone
 * opening http://192.168.x.x:5173, 'localhost' resolves to the phone itself. Deriving
 * the host from window.location means the same build works on the laptop, on the LAN,
 * and anywhere else. VITE_API_URL overrides it entirely when set.
 */
const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${API_PORT}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rental_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (e.g. token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('rental_token');
      localStorage.removeItem('rental_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
