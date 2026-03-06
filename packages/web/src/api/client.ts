import axios from 'axios';
import { supabase } from '@/config/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: get token from Supabase session
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor: on 401, attempt session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (session && !refreshError) {
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      }

      // Refresh failed — sign out
      await supabase.auth.signOut();
      window.location.reload();
    }

    return Promise.reject(error);
  },
);

export default api;
