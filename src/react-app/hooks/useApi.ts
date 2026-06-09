import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

export type ApiError = {
  status: number;
  code: string;
  detail: string;
  errors?: Record<string, string[]>;
  requestId?: string;
};

const REQUEST_ID_HEADER = 'X-Request-Id';

function generateRequestId(): string {
  const c = (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined) as
    | (Crypto & { randomUUID?: () => string })
    | undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `req-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<Record<string, unknown>>;
    const res = axErr.response;
    const body = (res?.data ?? {}) as Record<string, unknown>;

    const detail =
      (typeof body.detail === 'string' && body.detail) ||
      (typeof body.error === 'string' && body.error) ||
      axErr.message ||
      'Request failed';

    const code =
      (typeof body.code === 'string' && body.code) ||
      (typeof body.error_code === 'string' && body.error_code) ||
      (res ? `http_${res.status}` : 'network_error');

    const errors =
      body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)
        ? (body.errors as Record<string, string[]>)
        : undefined;

    const headerRequestId =
      (res?.headers && (res.headers as Record<string, string>)[REQUEST_ID_HEADER.toLowerCase()]) ||
      (res?.headers && (res.headers as Record<string, string>)[REQUEST_ID_HEADER]) ||
      undefined;
    const bodyRequestId = typeof body.request_id === 'string' ? body.request_id : undefined;
    const configRequestId =
      (axErr.config?.headers as AxiosHeaders | undefined)?.get?.(REQUEST_ID_HEADER) ?? undefined;

    return {
      status: res?.status ?? 0,
      code,
      detail: String(detail),
      errors,
      requestId: bodyRequestId || headerRequestId || (configRequestId as string | undefined),
    };
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  return { status: 0, code: 'unknown_error', detail: message };
}

export function extractApiError(err: unknown): ApiError {
  if (err && typeof err === 'object' && 'apiError' in err) {
    const attached = (err as { apiError?: ApiError }).apiError;
    if (attached) return attached;
  }
  return normalizeApiError(err);
}

export function getFieldErrors(err: unknown): Record<string, string[]> {
  return extractApiError(err).errors ?? {};
}

/**
 * Returns the backend-provided `detail` message when the server responded with
 * a body, otherwise falls back to the caller's domain-specific message (used for
 * pre-response network failures, where axios only exposes a generic "Network Error").
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const apiErr = extractApiError(err);
  if (apiErr.status === 0) return fallback;
  return apiErr.detail || fallback;
}

export function reportApiError(error: ApiError, context?: Record<string, unknown>): void {
  if (typeof console !== 'undefined') {
    console.error('[api-error]', {
      status: error.status,
      code: error.code,
      detail: error.detail,
      requestId: error.requestId,
      ...(error.errors ? { errors: error.errors } : {}),
      ...(context ?? {}),
    });
  }
}

// Auto-detect API URL based on current host
const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Domain-specific API routing
    if (hostname === 'timetable.dashoapp.com') {
      return 'https://exams.dashoapp.com/api'; // Timetable uses same backend
    }

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Option A: Use local backend (direct connection)
      // return 'http://127.0.0.1:8000/api';

      // Option B: Use production backend (via relative path + Vite proxy to avoid CORS issues)
      return '/api';

      // Option C: Use production backend directly (triggers CORS issues in local development)
      // return 'https://exams.dashoapp.com/api';
    }

    // For production exams domain or any other domain
    return 'https://exams.dashoapp.com/api';
  }

  // Fallback
  return 'https://exams.dashoapp.com/api';
};

const DEFAULT_API_BASE_URL = getDefaultApiUrl();

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies (like JWT refresh tokens)
});

// Interceptor to attach JWT token, device fingerprint, and request id to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add device fingerprint to headers if available
    const deviceFingerprint = localStorage.getItem('device_fingerprint');
    const isAuthEndpoint = config.url?.includes('/auth/login/') || config.url?.includes('/auth/logout/') || config.url?.includes('/auth/token/refresh/');
    if (deviceFingerprint && !isAuthEndpoint) {
      config.headers['X-Device-Fingerprint'] = deviceFingerprint;
    }

    if (!config.headers[REQUEST_ID_HEADER]) {
      config.headers[REQUEST_ID_HEADER] = generateRequestId();
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
    const deviceSessionInvalid =
      error.response?.data?.code === 'device_session_invalid' ||
      error.response?.data?.error_code === 'DEVICE_SESSION_INVALID';
    if (error.response?.status === 401 && deviceSessionInvalid) {
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
        const normalized = normalizeApiError(refreshError);
        (refreshError as { apiError?: ApiError }).apiError = normalized;
        reportApiError(normalized, { phase: 'token_refresh' });
        return Promise.reject(refreshError);
      }
    }

    const normalized = normalizeApiError(error);
    (error as { apiError?: ApiError }).apiError = normalized;
    reportApiError(normalized, {
      url: originalRequest?.url,
      method: originalRequest?.method,
    });
    return Promise.reject(error);
  }
);

// Custom hook for API calls
export function useApi<T>(
  endpoint: string,
  options: { clearDataOnFetch?: boolean } = {}
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

    if (options.clearDataOnFetch) {
      setData(null);
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(endpoint);
      setData(response.data);
    } catch (err) {
      setError(extractApiError(err).detail);
    } finally {
      setLoading(false);
    }
  }, [endpoint, options.clearDataOnFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}