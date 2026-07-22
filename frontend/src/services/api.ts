import axios from 'axios';

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  // Remove trailing slash(es)
  const trimmed = raw.replace(/\/+$/, '');
  // Ensure it ends with /api
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_URL = resolveApiUrl();

// Server root URL (without /api suffix), used for static file URLs like /uploads/...
export const SERVER_URL = API_URL.replace(/\/api$/, '');

export { API_URL };

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

