export function getCorsOrigins(): string | string[] {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CORS_ORIGIN?.trim() ||
    'http://localhost:3000';

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return 'http://localhost:3000';
  }

  return origins.length === 1 ? origins[0] : origins;
}
