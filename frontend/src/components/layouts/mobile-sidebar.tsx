'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items';
import { PORTAL_NAV_ITEMS } from '@/constants/portal-nav-items';
import { filterNavItemsForShell, filterSidebarItems } from '@/utils/filter-sidebar-items';
import { signOut } from '@/services/auth';
import { useAuthStore, selectUser, selectUserPermissions } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  sheetBrand?: string;
  usePortalNav?: boolean;
}

export function MobileSidebar({ sheetBrand, usePortalNav }: MobileSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const permissions = useAuthStore(selectUserPermissions);
  const [open, setOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const items = useMemo(() => {
    if (usePortalNav) {
      return filterSidebarItems(PORTAL_NAV_ITEMS, permissions);
    }
    return filterNavItemsForShell(SIDEBAR_ITEMS, permissions);
  }, [permissions, usePortalNav]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      setOpen(false);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex h-full w-[min(100vw-3rem,20rem)] flex-col gap-0 p-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {sheetBrand ? (
            <div className="shrink-0 border-b px-4 py-4 pr-12 text-lg font-semibold">{sheetBrand}</div>
          ) : (
            <div className="shrink-0 border-b px-4 py-4 pr-12 text-lg font-semibold">RBAC System</div>
          )}

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t px-4 py-4">
            <p className="truncate text-xs text-muted-foreground" title={user?.email}>
              {user?.email}
            </p>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-destructive hover:text-destructive"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              {isSigningOut ? 'Signing out…' : 'Log out'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
