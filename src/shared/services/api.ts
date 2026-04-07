import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
});

/* Attach Bearer token from localStorage on every request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Clear expired token on 401 responses */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear expired token so user is forced to sign in again
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  },
);

export default api;

