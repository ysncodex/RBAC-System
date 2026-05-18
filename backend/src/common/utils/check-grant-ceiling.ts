import { ForbiddenException } from '@nestjs/common';

export function checkGrantCeiling(
  actorPermissions: string[],
  requestedPermissions: string[],
): boolean {
  return requestedPermissions.every((permission) =>
    actorPermissions.includes(permission),
  );
}

export function assertGrantCeiling(
  actorPermissions: string[],
  requestedPermissions: string[],
): void {
  if (actorPermissions.includes('*')) return;

  const unauthorized = requestedPermissions.filter(
    (p) => !actorPermissions.includes(p),
  );

  if (unauthorized.length > 0) {
    throw new ForbiddenException(
      `You cannot assign permissions you do not hold: ${unauthorized.join(', ')}`,
    );
  }
}
