import axios, { AxiosError } from 'axios';
import { ErrorCode } from './errors/types';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();

    return config;
  },
  (error) => {
    return Promise.reject({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Failed to send request',
      details: error
    });
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error occurred',
        details: error
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Request timed out',
        details: error
      });
    }

    // Handle rate limiting
    if (error.response.status === 429) {
      return Promise.reject({
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
        details: error.response.data
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      const errorCode = error.response.data?.code;

      // Only redirect to login for specific auth errors
      if (
        errorCode === ErrorCode.UNAUTHORIZED ||
        errorCode === ErrorCode.TOKEN_EXPIRED ||
        errorCode === ErrorCode.INVALID_TOKEN ||
        errorCode === ErrorCode.SESSION_EXPIRED
      ) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    // Return the error response as is
    return Promise.reject(error.response.data);
  }
);