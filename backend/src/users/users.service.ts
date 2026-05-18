import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';

import { AuditAction, UserStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

import {
  actorSeesFullUserDirectory,
  assertActorCanAccessTargetUser,
  getManagedSubtreeUserIds,
} from '../common/utils/team-scope';
import { assertGrantCeiling } from '../common/utils/check-grant-ceiling';

const SCOPED_CREATABLE_ROLE_SLUGS = ['agent', 'customer'] as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private readonly userInclude = {
    role: true,
    userPermissions: {
      include: {
        permission: true,
      },
    },
  } as const;

  async findAll(actorId: string, actorPermissions: string[]) {
    if (actorSeesFullUserDirectory(actorPermissions)) {
      return this.prisma.user.findMany({
        include: this.userInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    const subtreeIds = await getManagedSubtreeUserIds(this.prisma, actorId);
    if (subtreeIds.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: { id: { in: subtreeIds } },
      include: this.userInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actorId: string, actorPermissions: string[]) {
    const user = await this.loadUserWithIncludes(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );
    return user;
  }

  private async loadUserWithIncludes(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });
  }

  /**
   * Login and registration use normalized (trim + lower) emails; staff-created users may
   * historically have had mixed case — match case-insensitively on PostgreSQL.
   */
  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: 'insensitive' },
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
  }

  async create(
    dto: CreateUserDto,
    actorId: string,
    actorPermissions: string[],
  ) {
    const emailKey = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: emailKey, mode: 'insensitive' } },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    const fullDirectory = actorSeesFullUserDirectory(actorPermissions);
    let managedById: string | null = null;

    if (!fullDirectory) {
      if (
        !SCOPED_CREATABLE_ROLE_SLUGS.includes(
          role.slug as (typeof SCOPED_CREATABLE_ROLE_SLUGS)[number],
        )
      ) {
        throw new ForbiddenException(
          'You can only create users with the agent or customer role in your team',
        );
      }
      managedById = actorId;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: emailKey,
        passwordHash: hashedPassword,
        roleId: dto.roleId,
        managedById,
      },
    });

    if (dto.permissions && dto.permissions.length > 0) {
      assertGrantCeiling(actorPermissions, dto.permissions);
      await this.assignPermissions(user.id, dto.permissions);
    }

    const createdUser = await this.findOne(user.id, actorId, actorPermissions);

    await this.auditService.createLog({
      actorId,
      action: AuditAction.CREATE,
      targetType: 'USER',
      targetId: user.id,
    });

    return createdUser;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId: string,
    actorPermissions: string[],
  ) {
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );

    if (dto.roleId && !actorSeesFullUserDirectory(actorPermissions)) {
      const newRole = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!newRole) {
        throw new BadRequestException('Invalid role');
      }
      if (
        !SCOPED_CREATABLE_ROLE_SLUGS.includes(
          newRole.slug as (typeof SCOPED_CREATABLE_ROLE_SLUGS)[number],
        )
      ) {
        throw new ForbiddenException(
          'You can only assign agent or customer roles in your team',
        );
      }
    }

    if (dto.permissions) {
      assertGrantCeiling(actorPermissions, dto.permissions);
      await this.prisma.userPermission.deleteMany({
        where: { userId: id },
      });

      await this.assignPermissions(id, dto.permissions);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        roleId: dto.roleId,
      },
    });

    const updatedUser = await this.findOne(id, actorId, actorPermissions);

    await this.auditService.createLog({
      actorId,
      action: AuditAction.UPDATE,
      targetType: 'USER',
      targetId: id,
    });

    return updatedUser;
  }

  async delete(id: string, actorId: string, actorPermissions: string[]) {
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );

    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditService.createLog({
      actorId,
      action: AuditAction.DELETE,
      targetType: 'USER',
      targetId: id,
    });

    return { success: true };
  }

  private assertNotSelfStatusChange(targetId: string, actorId: string) {
    if (targetId === actorId) {
      throw new BadRequestException(
        'You cannot change your own account status',
      );
    }
  }

  async suspend(id: string, actorId: string, actorPermissions: string[]) {
    this.assertNotSelfStatusChange(id, actorId);
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );
    const existing = await this.loadUserWithIncludes(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (existing.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Only active users can be suspended');
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id },
        data: {
          status: UserStatus.SUSPENDED,
          accessTokenVersion: { increment: 1 },
        },
      }),
    ]);

    await this.auditService.createLog({
      actorId,
      action: AuditAction.SUSPEND_USER,
      targetType: 'USER',
      targetId: id,
    });

    return this.findOne(id, actorId, actorPermissions);
  }

  async ban(id: string, actorId: string, actorPermissions: string[]) {
    this.assertNotSelfStatusChange(id, actorId);
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );
    const existing = await this.loadUserWithIncludes(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (existing.status === UserStatus.BANNED) {
      throw new BadRequestException('User is already banned');
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id },
        data: {
          status: UserStatus.BANNED,
          accessTokenVersion: { increment: 1 },
        },
      }),
    ]);

    await this.auditService.createLog({
      actorId,
      action: AuditAction.BAN_USER,
      targetType: 'USER',
      targetId: id,
    });

    return this.findOne(id, actorId, actorPermissions);
  }

  async reactivate(id: string, actorId: string, actorPermissions: string[]) {
    this.assertNotSelfStatusChange(id, actorId);
    await assertActorCanAccessTargetUser(
      this.prisma,
      actorId,
      id,
      actorPermissions,
    );
    const existing = await this.loadUserWithIncludes(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (existing.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });

    await this.auditService.createLog({
      actorId,
      action: AuditAction.UPDATE,
      targetType: 'USER',
      targetId: id,
      metadata: { status: UserStatus.ACTIVE, reason: 'reactivate' },
    });

    return this.findOne(id, actorId, actorPermissions);
  }

  async assignPermissions(userId: string, permissionSlugs: string[]) {
    if (permissionSlugs.length === 0) {
      return;
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        slug: {
          in: permissionSlugs,
        },
      },
    });

    await this.prisma.userPermission.createMany({
      data: permissions.map((permission) => ({
        userId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }
}
