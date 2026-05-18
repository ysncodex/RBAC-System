'use client';

import { ReactNode, useMemo } from 'react';

import { useAuthStore, selectUserPermissions } from '@/store/auth.store';

interface Props {
  permission: string;

  children: ReactNode;
}

export function PermissionGate({ permission, children }: Props) {
  const permissions = useAuthStore(selectUserPermissions);

  // Convert to Set for O(1) lookup performance
  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);

  const allowed = permissionsSet.has(permission);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
