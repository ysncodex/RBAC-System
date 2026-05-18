import axios from 'axios';

import { getApiBaseUrl } from '@/lib/api-base-url';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});
