function normalizeOrigin(raw?: string): string {
  if (!raw?.trim()) return '';

  const value = raw.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(value)) return '';

  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function originFromApiUrl(raw?: string): string {
  if (!raw?.trim()) return '';
  const value = raw.trim();
  if (!/^https?:\/\//i.test(value)) return '';

  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export function resolveApiOrigin(): string {
  const candidates = [
    process.env.API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_PROXY_TARGET,
    process.env.RENDER_API_URL,
    originFromApiUrl(process.env.NEXT_PUBLIC_API_URL),
  ];

  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate);
    if (origin) return origin;
  }

  return '';
}

export function missingApiOriginMessage(): string {
  return [
    'Backend API origin is not configured for the Netlify proxy.',
    'Set one of: API_PROXY_TARGET, NEXT_PUBLIC_API_PROXY_TARGET, RENDER_API_URL,',
    'or NEXT_PUBLIC_API_URL=https://your-service.onrender.com/api',
  ].join(' ');
}
