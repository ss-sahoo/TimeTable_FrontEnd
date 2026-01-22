import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Auto-detect API URL based on current host
const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Domain-specific API routing
    if (hostname === 'timetable.dashoapp.com') {
      return 'https://exams.dashoapp.com/api'; // Timetable uses same backend
    }
    
    // For development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://exams.dashoapp.com/api';
    }
    
    // For production exams domain or any other domain
    return 'https://exams.dashoapp.com/api';
  }
  
  // Fallback
  return 'https://exams.dashoapp.com/api';
};

const DEFAULT_API_BASE_URL = getDefaultApiUrl();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies (like JWT refresh tokens)
});

// Interceptor to attach JWT token and device fingerprint to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Add device fingerprint to headers if available
    const deviceFingerprint = localStorage.getItem('device_fingerprint');
    if (deviceFingerprint) {
      config.headers['X-Device-Fingerprint'] = deviceFingerprint;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle token refresh and device session invalidation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this is a device session invalidation error
    if (error.response?.status === 401 && error.response?.data?.error_code === 'DEVICE_SESSION_INVALID') {
      // Device session was invalidated (user logged in on another device)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('device_fingerprint');
      
      // Redirect to login with a message
      window.location.href = '/login?reason=device_switched';
      return Promise.reject(error);
    }
    
    // If error status is 401 (Unauthorized) and it's not a login/refresh request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Request new access token using refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Update original request header with new access token
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        return api(originalRequest); // Retry original request
      } catch (refreshError) {
        // Refresh token failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Custom hook for API calls
export function useApi<T>(
  endpoint: string
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(endpoint);
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}