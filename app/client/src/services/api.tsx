import { API_ENDPOINT } from '@/config/env';
import axios from 'axios'


export const apiRequest = axios.create({
  baseURL: API_ENDPOINT,
  withCredentials: true
});