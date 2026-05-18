'use client';

import Link from 'next/link';
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

interface MobileSidebarProps {
  sheetBrand?: string;
  usePortalNav?: boolean;
}

export function MobileSidebar({ sheetBrand, usePortalNav }: MobileSidebarProps) {
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

      <SheetContent side="left" className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          {sheetBrand ? (
            <div className="mb-4 border-b pb-3 text-lg font-semibold">{sheetBrand}</div>
          ) : null}

          <div className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto border-t pt-4">
            <p className="px-3 text-xs text-muted-foreground">{user?.email}</p>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-destructive hover:text-destructive"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden />
              {isSigningOut ? 'Signing out…' : 'Log out'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
