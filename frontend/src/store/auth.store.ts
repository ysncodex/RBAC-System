import { create } from 'zustand';

import type { AuthUser } from '@/types/auth';

const EMPTY_PERMISSIONS: string[] = [];

interface AuthState {
  accessToken: string | null;

  user: AuthUser | null;

  sessionReady: boolean;

  setAuth: (accessToken: string, user: AuthUser) => void;

  logout: () => void;

  setSessionReady: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,

  user: null,

  sessionReady: false,

  setAuth: (accessToken, user) =>
    set({
      accessToken,
      user,
    }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
    }),

  setSessionReady: (value) => set({ sessionReady: value }),
}));

export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectUser = (state: AuthState) => state.user;
export const selectUserPermissions = (state: AuthState) =>
  state.user?.permissions ?? EMPTY_PERMISSIONS;
export const selectUserPermissionsSet = (state: AuthState) =>
  new Set(state.user?.permissions ?? EMPTY_PERMISSIONS);
export const selectSessionReady = (state: AuthState) => state.sessionReady;
