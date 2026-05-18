import { Injectable } from '@nestjs/common';

import type { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        actor: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createLog(data: {
    actorId: string;

    action: AuditAction;

    targetType: string;

    targetId?: string;

    metadata?: Prisma.InputJsonValue;

    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
