import type { CookieOptions } from 'express';

import { getRefreshCookieMaxAgeMs } from './refresh-expiry';

function resolveSameSite(): CookieOptions['sameSite'] {
  const configured = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (
    configured === 'none' ||
    configured === 'lax' ||
    configured === 'strict'
  ) {
    return configured;
  }
  return 'lax';
}

export function refreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = resolveSameSite();

  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    maxAge: getRefreshCookieMaxAgeMs(),
    path: '/',
  };
}

export function clearRefreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = resolveSameSite();

  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/',
  };
}
