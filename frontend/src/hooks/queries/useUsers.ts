import { useQuery } from '@tanstack/react-query';

import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import { getUsers } from '@/services/users.service';
import type { User } from '@/types/user';

export function useUsers() {
  const authReady = useAuthReadyForApi();
  const q = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: authReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });

  return {
    ...q,
    isLoading: !authReady || q.isLoading,
  };
}
