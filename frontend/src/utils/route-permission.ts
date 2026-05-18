import { ROUTE_PERMISSIONS } from '@/constants/route-permissions';

const ROUTE_PREFIXES = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);

export function normalizeJwtPermissions(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === 'string');
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (p): p is string => typeof p === 'string'
    );
  }
  return [];
}

export function getRequiredRoutePermission(pathname: string): string | undefined {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  for (const prefix of ROUTE_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return ROUTE_PERMISSIONS[prefix as keyof typeof ROUTE_PERMISSIONS];
    }
  }
  return undefined;
}
