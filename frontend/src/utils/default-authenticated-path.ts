const STAFF_HOME_CANDIDATES: readonly { permission: string; path: string }[] = [
  { permission: 'dashboard.view', path: '/dashboard' },
  { permission: 'leads.view', path: '/leads' },
  { permission: 'tasks.view', path: '/tasks' },
  { permission: 'reports.view', path: '/reports' },
  { permission: 'users.view', path: '/users' },
  { permission: 'permissions.view', path: '/permissions' },
  { permission: 'settings.view', path: '/settings' },
  { permission: 'audit.view', path: '/audit' },
] as const;

const PORTAL_HOME_CANDIDATES: readonly { permission: string; path: string }[] = [
  { permission: 'portal.view', path: '/portal' },
  { permission: 'portal.tickets.view', path: '/portal/tickets' },
  { permission: 'portal.orders.view', path: '/portal/orders' },
  { permission: 'portal.interactions.view', path: '/portal/interactions' },
] as const;

export function getDefaultAuthenticatedPath(permissions: string[]): string {
  const set = new Set(permissions);
  for (const { permission, path } of STAFF_HOME_CANDIDATES) {
    if (set.has(permission)) {
      return path;
    }
  }
  for (const { permission, path } of PORTAL_HOME_CANDIDATES) {
    if (set.has(permission)) {
      return path;
    }
  }
  return '/403';
}
