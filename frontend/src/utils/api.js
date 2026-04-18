import axios from 'axios';

const api = axios.create({
  baseURL: 'https://code-arena-backend-720y.onrender.com/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('arena_admin_token');
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

export default api;