import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const PUBLIC_ENDPOINTS = [
  '/auth/',
];

const isPublicEndpoint = (url = '') =>
  PUBLIC_ENDPOINTS.some(prefix => url.startsWith(prefix) || url.startsWith(prefix.replace(/\/$/, '')));

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getTokenFromStore = () => {
  try {
    return useAuthStore.getState().token;
  } catch (e) {
    return localStorage.getItem('token');
  }
};

const logoutClean = (reason = 'expired') => {
  try {
    useAuthStore.getState().logout();
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?${reason}=true`;
  }
};

api.interceptors.request.use((config) => {
  if (isPublicEndpoint(config.url)) {
    return config;
  }
  const token = getTokenFromStore();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    // Redirigir si el token ha expirado (401) o se deniega el acceso a un endpoint protegido (403)
    if ((status === 401 || status === 403) && !isPublicEndpoint(url)) {
      logoutClean('expired');
    }
    return Promise.reject(error);
  }
);

export default api;

