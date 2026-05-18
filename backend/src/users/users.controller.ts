import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { PermissionsGuard } from '../common/guards/permissions.guard';

import { RequirePermissions } from '../common/decorators/permissions.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { PERMISSIONS } from '../common/constants/permissions';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

import { ResolvedActorPermissions } from '../common/decorators/resolved-permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  findAll(
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.findAll(user.sub, actorPermissions);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.findOne(id, user.sub, actorPermissions);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.create(dto, user.sub, actorPermissions);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.update(id, dto, user.sub, actorPermissions);
  }

  @Post(':id/suspend')
  @RequirePermissions(PERMISSIONS.USERS_SUSPEND)
  suspend(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.suspend(id, user.sub, actorPermissions);
  }

  @Post(':id/ban')
  @RequirePermissions(PERMISSIONS.USERS_BAN)
  ban(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.ban(id, user.sub, actorPermissions);
  }

  @Post(':id/reactivate')
  @RequirePermissions(PERMISSIONS.USERS_REACTIVATE)
  reactivate(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.reactivate(id, user.sub, actorPermissions);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @ResolvedActorPermissions() actorPermissions: string[],
  ) {
    return this.usersService.delete(id, user.sub, actorPermissions);
  }
}
