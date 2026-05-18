import { type JWTPayload, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { hasPermission } from './src/utils/has-permission';
import { getDefaultAuthenticatedPath } from './src/utils/default-authenticated-path';
import { getRequiredRoutePermission, normalizeJwtPermissions } from './src/utils/route-permission';
import { getSafeReturnPath, getSafeRedirectFromReferer } from './src/utils/safe-return-url';

const GUEST_PATHS = new Set(['/login', '/signup', '/forgot-password']);

function isGuestPath(pathname: string): boolean {
  return GUEST_PATHS.has(pathname);
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const intended = request.nextUrl.pathname + request.nextUrl.search;
  const safe = getSafeReturnPath(intended);
  if (safe) {
    loginUrl.searchParams.set('returnUrl', safe);
  }
  return NextResponse.redirect(loginUrl);
}

function extractPermissionsFromRefreshPayload(payload: JWTPayload): string[] | null {
  if (!('permissions' in payload) || payload.permissions === undefined) {
    return null;
  }
  return normalizeJwtPermissions(payload.permissions);
}

async function getPermissionsFromRefreshCookie(
  request: NextRequest,
  refreshSecret: string
): Promise<string[] | null> {
  const refresh = request.cookies.get('refreshToken')?.value;
  if (!refresh) return null;
  try {
    const { payload } = await jwtVerify(refresh, new TextEncoder().encode(refreshSecret));
    return extractPermissionsFromRefreshPayload(payload);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/register') {
    const url = request.nextUrl.clone();
    url.pathname = '/signup';
    return NextResponse.redirect(url);
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    if (isGuestPath(pathname)) {
      return NextResponse.next();
    }
    console.error(
      '[middleware] JWT_REFRESH_SECRET is missing — cannot verify refresh session cookies'
    );
    return redirectToLogin(request);
  }

  const permissions = await getPermissionsFromRefreshCookie(request, refreshSecret);
  const hasSession = permissions !== null;

  if (pathname === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isGuestPath(pathname)) {
    if (!hasSession) {
      return NextResponse.next();
    }
    const siteOrigin = request.nextUrl.origin;
    const ref = request.headers.get('referer');
    const target =
      getSafeRedirectFromReferer(ref, siteOrigin) ?? getDefaultAuthenticatedPath(permissions);
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const home = getDefaultAuthenticatedPath(permissions);
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (!hasSession) {
    return redirectToLogin(request);
  }

  const requiredPermission = getRequiredRoutePermission(pathname);

  if (!hasPermission(permissions, requiredPermission)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/register',
    '/login',
    '/signup',
    '/forgot-password',
    '/dashboard',
    '/dashboard/:path*',
    '/users',
    '/users/:path*',
    '/permissions',
    '/permissions/:path*',
    '/leads',
    '/leads/:path*',
    '/tasks',
    '/tasks/:path*',
    '/reports',
    '/reports/:path*',
    '/audit',
    '/audit/:path*',
    '/settings',
    '/settings/:path*',
    '/portal',
    '/portal/:path*',
  ],
};
