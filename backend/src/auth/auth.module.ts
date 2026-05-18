import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      global: true,

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') || 'default_secret',

        signOptions: {
          expiresIn: (configService.get<string | number>(
            'ACCESS_TOKEN_EXPIRES',
          ) || '15m') as any,
        },
      }),
    }),

    UsersModule,
    PrismaModule,
    AuditModule,
  ],

  controllers: [AuthController],
  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
