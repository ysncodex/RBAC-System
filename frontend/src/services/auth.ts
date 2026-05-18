import axios, { AxiosError } from 'axios';

import type { AuthResponse } from '@/types/auth';

import { useAuthStore } from '@/store/auth.store';

import { getApiBaseUrl } from '@/lib/api-base-url';
import { api } from './api';
import { clearAppSession } from './session-cookie';

const refreshCookieClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

async function postRefreshResponse() {
  return refreshCookieClient.post<AuthResponse>('auth/refresh', {}, { validateStatus: () => true });
}

export async function tryRefreshAccessToken(): Promise<AuthResponse | null> {
  try {
    const res = await postRefreshResponse();
    if (res.status !== 200 && res.status !== 201) {
      return null;
    }
    return res.data;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<AuthResponse> {
  const res = await postRefreshResponse();
  if (res.status !== 200 && res.status !== 201) {
    throw new AxiosError(
      'Session refresh failed',
      String(res.status),
      res.config,
      res.request,
      res
    );
  }
  return res.data;
}

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('auth/login', credentials);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('auth/register', payload);
  return data;
}

const SKIP_REFRESH_BOOTSTRAP_KEY = 'rbac:skipRefreshBootstrap';

export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SKIP_REFRESH_BOOTSTRAP_KEY, '1');
    } catch {}
  }

  try {
    await api.post('auth/logout');
  } catch {}

  try {
    await clearAppSession();
  } catch {}

  useAuthStore.getState().logout();

  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

export { signOut as logout };

export const AUTH_SKIP_REFRESH_BOOTSTRAP_KEY = SKIP_REFRESH_BOOTSTRAP_KEY;

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    if (payload?.message !== undefined) {
      const msg = payload.message;
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
