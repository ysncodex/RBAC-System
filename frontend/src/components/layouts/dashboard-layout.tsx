'use client';

import { ReactNode } from 'react';

import { Sidebar } from './sidebar';

import { Header } from './header';
import { usePrivateRouteGuard } from '@/hooks/useAuthGuard';

interface Props {
  children: ReactNode;
}

export function DashboardLayout({ children }: Props) {
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
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
