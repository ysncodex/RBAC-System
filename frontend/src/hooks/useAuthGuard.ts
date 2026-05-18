'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthStore,
  selectAccessToken,
  selectSessionReady,
  selectUserPermissions,
} from '@/store/auth.store';
import { getDefaultAuthenticatedPath } from '@/utils/default-authenticated-path';

export function useGuestGuard() {
  const router = useRouter();
  const accessToken = useAuthStore(selectAccessToken);
  const permissions = useAuthStore(selectUserPermissions);
  const sessionReady = useAuthStore(selectSessionReady);

  useEffect(() => {
    if (!sessionReady) return;

    if (accessToken) {
      const path = getDefaultAuthenticatedPath(permissions);
      router.replace(path);
    }
  }, [accessToken, sessionReady, router, permissions]);

  return sessionReady && !accessToken;
}

export function usePrivateRouteGuard(redirectPath = '/login') {
  const router = useRouter();
  const accessToken = useAuthStore(selectAccessToken);
  const sessionReady = useAuthStore(selectSessionReady);

  useEffect(() => {
    if (!sessionReady) return;

    if (!accessToken) {
      router.replace(redirectPath);
    }
  }, [accessToken, sessionReady, router, redirectPath]);

  return sessionReady && !!accessToken;
}
