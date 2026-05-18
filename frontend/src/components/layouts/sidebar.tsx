'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons for the toggle button

import { SIDEBAR_ITEMS } from '@/constants/sidebar-items';
import { filterNavItemsForShell } from '@/utils/filter-sidebar-items';
import { useAuthStore, selectUserPermissions } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const permissions = useAuthStore(selectUserPermissions);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const items = useMemo(() => filterNavItemsForShell(SIDEBAR_ITEMS, permissions), [permissions]);

  return (
    <aside
      className={cn(
        'hidden border-r bg-background lg:sticky lg:top-0 lg:flex lg:h-dvh lg:shrink-0 lg:flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div
        className={cn(
          'border-b py-5 flex items-center',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        )}
      >
        {!isCollapsed && <h2 className="text-xl font-bold truncate">RBAC System</h2>}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200',
                isCollapsed ? 'justify-center gap-0' : 'justify-start gap-3', // Adjust alignment
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />

              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
