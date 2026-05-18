import { ROUTE_PERMISSIONS } from '../src/constants/route-permissions';
import { MIDDLEWARE_MATCHER } from '../src/constants/middleware-matcher';

const GUEST_PATHS = new Set(['/login', '/signup', '/forgot-password', '/register']);

function basePathFromMatcherEntry(entry: string): string {
  return entry.replace(/\/:path\*$/, '');
}

function collectRequiredBases(): string[] {
  const bases = new Set<string>();
  for (const entry of MIDDLEWARE_MATCHER) {
    const base = basePathFromMatcherEntry(entry);
    if (base === '/') continue;
    if (GUEST_PATHS.has(base)) continue;
    bases.add(base);
  }
  return [...bases].sort();
}

function main() {
  const requiredBases = collectRequiredBases();
  const routeKeys = new Set(Object.keys(ROUTE_PERMISSIONS));
  const missing: string[] = [];

  for (const base of requiredBases) {
    if (!routeKeys.has(base)) {
      missing.push(base);
    }
  }

  if (missing.length > 0) {
    console.error(
      'Missing ROUTE_PERMISSIONS entries for middleware-covered paths:\n',
      missing.join('\n')
    );
    process.exit(1);
  }

  console.log(
    `OK: ${requiredBases.length} protected path prefix(es) covered by ROUTE_PERMISSIONS.`
  );
}

main();
