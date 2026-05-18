import type { JwtSignOptions } from '@nestjs/jwt';

export function getRefreshExpiresIn(): JwtSignOptions['expiresIn'] {
  return process.env.REFRESH_TOKEN_EXPIRES as JwtSignOptions['expiresIn'];
}

function durationToMs(expiresIn: JwtSignOptions['expiresIn']): number {
  if (expiresIn === undefined || expiresIn === null) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  if (typeof expiresIn === 'number') {
    return expiresIn * 1000;
  }
  const s = String(expiresIn).trim();
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10) * 1000;
  }
  const m = /^(\d+)(ms|s|m|h|d|w)$/i.exec(s);
  if (!m) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return n * (mult[u] ?? 86_400_000);
}

export function getRefreshExpiresAt(): Date {
  return new Date(Date.now() + durationToMs(getRefreshExpiresIn()));
}

export function getRefreshCookieMaxAgeMs(): number {
  return durationToMs(getRefreshExpiresIn());
}
