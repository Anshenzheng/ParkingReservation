import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5000' 
  : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const parkingAPI = {
  getSpots: (params) => api.get('/api/parking-spots', { params }),
  getAvailableSpots: (params) => api.get('/api/parking-spots/available', { params }),
  createSpot: (data) => api.post('/api/parking-spots', data),
  updateSpot: (id, data) => api.put(`/api/parking-spots/${id}`, data),
  deleteSpot: (id) => api.delete(`/api/parking-spots/${id}`),
};

export const reservationAPI = {
  getReservations: (params) => api.get('/api/reservations', { params }),
  createReservation: (data) => api.post('/api/reservations', data),
  approveReservation: (id) => api.post(`/api/reservations/${id}/approve`),
  rejectReservation: (id, data) => api.post(`/api/reservations/${id}/reject`, data),
  cancelReservation: (id) => api.post(`/api/reservations/${id}/cancel`),
};

export const statisticsAPI = {
  getUsage: (params) => api.get('/api/statistics/usage', { params }),
};

export const commonAPI = {
  getBuildings: () => api.get('/api/buildings'),
};

export const userAPI = {
  getUsers: () => api.get('/api/users'),
};

export default api;
