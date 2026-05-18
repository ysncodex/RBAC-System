import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { PermissionsService } from './permissions.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { PermissionsGuard } from '../common/guards/permissions.guard';

import { RequirePermissions } from '../common/decorators/permissions.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { ResolvedActorPermissions } from '../common/decorators/resolved-permissions.decorator';

import { PERMISSIONS } from '../common/constants/permissions';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  findAll(@ResolvedActorPermissions() actorPermissions: string[]) {
    return this.permissionsService.getGroupedPermissionsForActor(
      actorPermissions,
    );
  }

  /**
   * Role picklist for Create/Edit user dialogs. Requires `users.view` (same gate as the Users
   * module) so managers do not depend on `permissions.view` only used for the Permissions console.
   */
  @Get('roles')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  listRoles(@ResolvedActorPermissions() actorPermissions: string[]) {
    return this.permissionsService.findRolesList(actorPermissions);
  }

  @Get('roles/:roleId')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  async listRolePermissionSlugs(@Param('roleId') roleId: string) {
    const permissionSlugs =
      await this.permissionsService.findRolePermissionSlugs(roleId);
    return { permissionSlugs };
  }

  @Patch('users/:userId')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_ASSIGN)
  assignUserPermissions(
    @Param('userId')
    userId: string,

    @Body()
    body: {
      permissions: string[];
    },

    @CurrentUser() user: { sub: string },

    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.permissionsService.assignUserPermissions(
      userId,
      body.permissions,
      actorPermissions,
      user.sub,
    );
  }

  @Patch('roles/:roleId')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_ASSIGN_ROLES)
  assignRolePermissions(
    @Param('roleId')
    roleId: string,

    @Body()
    body: {
      permissions: string[];
    },

    @CurrentUser() user: { sub: string },

    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.permissionsService.assignRolePermissions(
      roleId,
      body.permissions,
      actorPermissions,
      user.sub,
    );
  }
}
