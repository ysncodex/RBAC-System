import { ForbiddenException } from '@nestjs/common';

import type { PrismaService } from '../../prisma/prisma.service';

export const SCOPE_TREE_MAX_DEPTH = 10;

export function actorSeesFullUserDirectory(
  actorPermissions: string[],
): boolean {
  return actorPermissions.includes('users.view_all');
}

export async function getManagedSubtreeUserIds(
  prisma: PrismaService,
  rootManagerId: string,
): Promise<string[]> {
  const acc = new Set<string>();
  let frontier: string[] = [rootManagerId];

  for (
    let depth = 0;
    depth < SCOPE_TREE_MAX_DEPTH && frontier.length > 0;
    depth++
  ) {
    const children = await prisma.user.findMany({
      where: { managedById: { in: frontier } },
      select: { id: true },
    });
    const nextFrontier: string[] = [];
    for (const c of children) {
      if (!acc.has(c.id)) {
        acc.add(c.id);
        nextFrontier.push(c.id);
      }
    }
    frontier = nextFrontier;
  }

  return [...acc];
}

export async function assertActorCanAccessTargetUser(
  prisma: PrismaService,
  actorId: string,
  targetUserId: string,
  actorPermissions: string[],
): Promise<void> {
  if (actorSeesFullUserDirectory(actorPermissions)) {
    return;
  }
  if (actorId === targetUserId) {
    return;
  }
  const subtree = await getManagedSubtreeUserIds(prisma, actorId);
  if (subtree.includes(targetUserId)) {
    return;
  }
  throw new ForbiddenException('User is outside your management scope');
}
