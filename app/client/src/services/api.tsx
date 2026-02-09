import { API_ENDPOINT } from '@/config/env';
import axios from 'axios'

export const apiRequest = axios.create({
  baseURL: API_ENDPOINT,
  withCredentials: true
});

apiRequest.interceptors.response.use(
  response => response,
  (err) => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;

      if (status === 401) {
        try {
          window.location.replace('/login');
        } catch (e) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const getRequestMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  } else {
    return err instanceof Error ? err.message : String(err);
  }
};