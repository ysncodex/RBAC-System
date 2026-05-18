'use client';

import * as React from 'react';
import { Bell, Search, X } from 'lucide-react';

import { MobileSidebar } from './mobile-sidebar';
import { UserMenu } from './user-menu';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderSearchProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  className?: string;
}

export function HeaderSearch({ expanded, onExpandedChange, className }: HeaderSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('shrink-0 md:hidden', expanded && 'hidden')}
        aria-label="Open search"
        onClick={() => onExpandedChange(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          expanded
            ? 'absolute inset-x-0 top-0 z-50 flex h-14 items-center gap-2 bg-background px-3 sm:static sm:z-auto sm:h-auto sm:px-0'
            : 'relative ml-auto hidden w-full max-w-md md:flex lg:max-w-lg',
          className
        )}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          className="h-10 w-full min-w-0 rounded-full border border-transparent bg-muted/60 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-input focus:bg-background focus:ring-1 focus:ring-ring"
        />
        {expanded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Close search"
            onClick={() => onExpandedChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
    </>
  );
}

interface AppHeaderProps {
  title: string;
  sheetBrand?: string;
  usePortalNav?: boolean;
}

export function AppHeader({ title, sheetBrand, usePortalNav }: AppHeaderProps) {
  const [searchExpanded, setSearchExpanded] = React.useState(false);

  return (
    <header className="relative sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 sm:h-16 sm:gap-4 sm:px-6">
      <div
        className={cn(
          'flex min-w-0 items-center gap-2 sm:gap-3',
          searchExpanded && 'pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100'
        )}
      >
        <MobileSidebar sheetBrand={sheetBrand} usePortalNav={usePortalNav} />
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 md:gap-4',
          searchExpanded && 'justify-stretch md:justify-end'
        )}
      >
        <HeaderSearch
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
          className={searchExpanded ? 'flex-1 md:ml-auto' : undefined}
        />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className={cn('shrink-0', searchExpanded && 'hidden md:inline-flex')}
        >
          <Bell className="h-5 w-5" />
        </Button>

        <div className={cn(searchExpanded && 'hidden md:block')}>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
