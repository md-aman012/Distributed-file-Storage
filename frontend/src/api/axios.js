import axios from 'axios';

// In development: VITE_API_URL is not set, so we fall back to localhost.
// In production (Vercel): VITE_API_URL is set to the Render backend URL
// via Vercel's Environment Variables dashboard.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor — attach the JWT on every private request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
