import { API_ENDPOINT } from '@/config/env';
import axios from 'axios'

export const apiRequest = axios.create({
  baseURL: API_ENDPOINT,
  withCredentials: true
});



export const getRequestMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  } else {
    return err instanceof Error ? err.message : String(err);
  }
};