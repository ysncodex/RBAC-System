import { Badge } from '@/components/ui/badge';

import type { UserStatus } from '@/types/user-status';

interface Props {
  status: UserStatus;
}

export function StatusBadge({ status }: Props) {
  const variants = {
    ACTIVE: 'default',

    SUSPENDED: 'secondary',

    BANNED: 'destructive',
  } as const;

  return <Badge variant={variants[status]}>{status}</Badge>;
}
