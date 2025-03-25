import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', 
});

// Adiciona o token JWT automaticamente aos requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;