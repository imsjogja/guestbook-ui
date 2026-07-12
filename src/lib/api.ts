import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const tenant = useTenantStore.getState().currentTenant;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenant) {
      config.headers['X-Tenant-ID'] = tenant.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
