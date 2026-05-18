import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            userPermission: { deleteMany: jest.fn(), createMany: jest.fn() },
            permission: { findMany: jest.fn() },
            role: { findUnique: jest.fn() },
            refreshToken: { updateMany: jest.fn() },
            $transaction: jest.fn().mockImplementation((arg: unknown) => {
              if (typeof arg === 'function') {
                return (arg as (tx: unknown) => Promise<unknown>)({});
              }
              return Promise.all(arg as Promise<unknown>[]);
            }),
          },
        },
        { provide: AuditService, useValue: { createLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
