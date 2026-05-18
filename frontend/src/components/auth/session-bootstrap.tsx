'use client';

import { useEffect } from 'react';

import { tryRefreshAccessToken, AUTH_SKIP_REFRESH_BOOTSTRAP_KEY } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

export function SessionBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const skip =
        typeof window !== 'undefined' &&
        sessionStorage.getItem(AUTH_SKIP_REFRESH_BOOTSTRAP_KEY) === '1';

      if (skip) {
        try {
          sessionStorage.removeItem(AUTH_SKIP_REFRESH_BOOTSTRAP_KEY);
        } catch {}
        if (!cancelled) {
          setSessionReady(true);
        }
        return;
      }

      try {
        const session = await tryRefreshAccessToken();
        if (!cancelled && session) {
          setAuth(session.accessToken, session.user);
        }
      } catch {
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setAuth, setSessionReady]);

  return null;
}
