import axios from 'axios';

// In development: VITE_API_URL can fall back to localhost or Render URL.
// In production (Vercel): VITE_API_URL is set to the Render backend URL.
// Normalize baseURL to automatically append '/api' if user configured without it.
let rawUrl = (import.meta.env.VITE_API_URL || 'https://distributed-file-storage-66zm.onrender.com/api').trim();
rawUrl = rawUrl.replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}

const api = axios.create({
  baseURL: rawUrl,
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
