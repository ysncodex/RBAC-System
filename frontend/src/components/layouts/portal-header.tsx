'use client';

import { Bell, Search } from 'lucide-react';

import { MobileSidebar } from './mobile-sidebar';
import { UserMenu } from './user-menu';

import { Button } from '@/components/ui/button';

export function PortalHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <MobileSidebar sheetBrand="Customer Portal" usePortalNav />
        <h1 className="text-lg font-semibold hidden sm:block">Customer Portal</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <div className="relative w-full max-w-md lg:max-w-lg ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-full rounded-full bg-muted/60 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring border border-transparent focus:border-input transition-all"
          />
        </div>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="shrink-0">
          <Bell className="h-5 w-5" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
