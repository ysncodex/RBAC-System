import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

import { resolvePermissions } from '../../auth/utils/resolve-permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const userId = request.user.sub;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },

        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const resolvedPermissions = resolvePermissions(user);

    const hasPermissions = requiredPermissions.every((permission) =>
      resolvedPermissions.includes(permission),
    );

    if (!hasPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.resolvedPermissions = resolvedPermissions;

    return true;
  }
}
