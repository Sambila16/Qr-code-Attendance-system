import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const client = axios.create({ baseURL: `${API_BASE}/api` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('presence_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('presence_token');
      localStorage.removeItem('presence_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const API_BASE_URL = API_BASE;
export default client;
