import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuditService } from './audit.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { PermissionsGuard } from '../common/guards/permissions.guard';

import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.view')
  findAll() {
    return this.auditService.findAll();
  }
}
