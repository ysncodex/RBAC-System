import { getDefaultAuthenticatedPath } from '@/utils/default-authenticated-path';

const BLOCKED_PATHS = new Set(['/', '/login', '/signup', '/register', '/forgot-password', '/403']);

const ALLOWED_PREFIXES = [
  '/dashboard',
  '/portal',
  '/users',
  '/permissions',
  '/leads',
  '/tasks',
  '/reports',
  '/audit',
  '/settings',
] as const;

export function getSafeReturnPath(input: string | null | undefined): string | null {
  if (input == null || input === '') return null;
  let decoded = input.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (decoded.includes('://') || decoded.includes('..')) return null;

  const pathname = decoded.split('?', 1)[0] ?? '';
  if (!pathname || BLOCKED_PATHS.has(pathname)) return null;

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!allowed) return null;

  return decoded;
}

export function getPostLoginRedirect(
  returnUrl: string | null | undefined,
  permissions: string[]
): string {
  const safe = getSafeReturnPath(returnUrl);
  if (safe) return safe;
  return getDefaultAuthenticatedPath(permissions);
}

export function getSafeRedirectFromReferer(
  referer: string | null | undefined,
  siteOrigin: string
): string | null {
  if (referer == null || referer === '') return null;
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  if (url.origin !== siteOrigin) return null;
  const intended = `${url.pathname}${url.search}`;
  return getSafeReturnPath(intended);
}
