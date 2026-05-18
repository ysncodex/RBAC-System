import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  actorSeesFullUserDirectory,
  assertActorCanAccessTargetUser,
} from '../common/utils/team-scope';
import { assertGrantCeiling } from '../common/utils/check-grant-ceiling';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { slug: 'asc' }],
    });
  }

  async findRolesList(actorPermissions: string[]) {
    if (actorSeesFullUserDirectory(actorPermissions)) {
      return this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    return this.prisma.role.findMany({
      where: { slug: { in: ['agent', 'customer'] } },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findRolePermissionSlugs(roleId: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role.rolePermissions.map((rp) => rp.permission.slug);
  }

  async getGroupedPermissionsForActor(actorPermissions: string[]) {
    const permissions = await this.findAll();
    const visible = actorSeesFullUserDirectory(actorPermissions)
      ? permissions
      : permissions.filter((p) => actorPermissions.includes(p.slug));

    return visible.reduce(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }

  async assignUserPermissions(
    userId: string,
    permissionSlugs: string[],
    actorPermissions: string[],
    actorId: string,
  ) {
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      userId,
      actorPermissions,
    );

    if (!actorSeesFullUserDirectory(actorPermissions)) {
      const target = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (!target) {
        throw new NotFoundException('User not found');
      }
      if (target.role.slug !== 'agent') {
        throw new ForbiddenException(
          'You can only assign permission overrides to agents in your team',
        );
      }
    }

    assertGrantCeiling(actorPermissions, permissionSlugs);

    await this.prisma.userPermission.deleteMany({
      where: { userId },
    });

    const permissions = await this.prisma.permission.findMany({
      where: {
        slug: { in: permissionSlugs },
      },
    });

    await this.prisma.userPermission.createMany({
      data: permissions.map((permission) => ({
        userId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await this.auditService.createLog({
      actorId,
      action: AuditAction.ASSIGN_PERMISSION,
      targetType: 'USER',
      targetId: userId,
      metadata: { permissions: permissionSlugs },
    });

    return { success: true };
  }

  async assignRolePermissions(
    roleId: string,
    permissionSlugs: string[],
    actorPermissions: string[],
    actorId: string,
  ) {
    assertGrantCeiling(actorPermissions, permissionSlugs);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    const permissions = await this.prisma.permission.findMany({
      where: {
        slug: { in: permissionSlugs },
      },
    });

    await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await this.auditService.createLog({
      actorId,
      action: AuditAction.ASSIGN_PERMISSION,
      targetType: 'ROLE',
      targetId: roleId,
      metadata: { permissions: permissionSlugs },
    });

    return { success: true };
  }
}
