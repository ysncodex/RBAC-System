'use client';

import { ReactNode } from 'react';

import { PortalHeader } from './portal-header';
import { PortalSidebar } from './portal-sidebar';

import { usePrivateRouteGuard } from '@/hooks/useAuthGuard';

interface Props {
  children: ReactNode;
}

export function PortalLayout({ children }: Props) {
  const isAuthorized = usePrivateRouteGuard();

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <PortalSidebar />

      <div className="flex flex-1 flex-col">
        <PortalHeader />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
