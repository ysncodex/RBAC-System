import { selectAccessToken, selectSessionReady, useAuthStore } from '@/store/auth.store';

export function useAuthReadyForApi(): boolean {
  const sessionReady = useAuthStore(selectSessionReady);
  const accessToken = useAuthStore(selectAccessToken);
  return sessionReady && Boolean(accessToken);
}
