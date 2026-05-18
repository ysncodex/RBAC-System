import { SidebarItem } from '@/types/sidebar';

const STAFF_NAV_ORDER = [
  '/dashboard',
  '/leads',
  '/tasks',
  '/reports',
  '/users',
  '/permissions',
  '/audit',
  '/settings',
] as const;

function staffNavRank(href: string): number {
  const idx = (STAFF_NAV_ORDER as readonly string[]).indexOf(href);
  return idx === -1 ? 100 : idx;
}

export function filterSidebarItems(items: SidebarItem[], permissions: string[]): SidebarItem[] {
  return items.filter((item) => permissions.includes(item.permission));
}

/** Internal staff (dashboard) should not see customer portal entries in the main shell. */
export function filterNavItemsForShell(items: SidebarItem[], permissions: string[]): SidebarItem[] {
  const allowed = filterSidebarItems(items, permissions);
  if (permissions.includes('dashboard.view')) {
    const noPortal = allowed.filter((item) => !item.href.startsWith('/portal'));
    return [...noPortal].sort((a, b) => staffNavRank(a.href) - staffNavRank(b.href));
  }
  return allowed;
}
