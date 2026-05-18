import type { InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';

import { useAuthStore } from '@/store/auth.store';

import { refreshAccessToken, signOut } from './auth';
import { api } from './api';

type ConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshChain: Promise<Awaited<ReturnType<typeof refreshAccessToken>>> | null = null;

function getRefreshPromise() {
  if (!refreshChain) {
    refreshChain = refreshAccessToken().finally(() => {
      refreshChain = null;
    });
  }
  return refreshChain;
}

function isAuthPath(url: string) {
  return (
    url.includes('auth/login') ||
    url.includes('auth/register') ||
    url.includes('auth/refresh') ||
    url.includes('auth/logout')
  );
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
  if (isAuthPath(fullUrl)) {
    delete config.headers.Authorization;
    return config;
  }

  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const original = error.config as ConfigWithRetry;
    const status = error.response?.status;

    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = `${original.baseURL ?? ''}${original.url ?? ''}`;
    if (isAuthPath(url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { accessToken: newToken, user } = await getRefreshPromise();
      useAuthStore.getState().setAuth(newToken, user);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      void signOut();
      return Promise.reject(error);
    }
  }
);
