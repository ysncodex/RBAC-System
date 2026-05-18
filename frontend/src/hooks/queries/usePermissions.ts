import { useQuery } from '@tanstack/react-query';

import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import { getPermissions } from '@/services/permissions.service';

export function usePermissions() {
  const authReady = useAuthReadyForApi();
  const q = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    enabled: authReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });

  return {
    ...q,
    isLoading: !authReady || q.isLoading,
  };
}
