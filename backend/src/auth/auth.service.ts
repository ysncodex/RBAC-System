import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { UserStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // or 'bcrypt', depending on what you kept
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  resolvePermissions,
  type UserWithResolvedPermissions,
} from './utils/resolve-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  getRefreshExpiresAt,
  getRefreshExpiresIn,
} from './utils/refresh-expiry';

type RefreshClaimsUser = UserWithResolvedPermissions & {
  id: string;
  email: string;
  role: UserWithResolvedPermissions['role'] & { slug: string };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const roleSlug = process.env.SIGNUP_DEFAULT_ROLE_SLUG?.trim();

    const role = await this.prisma.role.findUnique({
      where: { slug: roleSlug },
    });

    if (!role) {
      throw new BadRequestException(
        `Signup role "${roleSlug}" not found; seed the database or set SIGNUP_DEFAULT_ROLE_SLUG`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: role.id,
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

    const permissions = resolvePermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      permissions,
      role: user.role.slug,
      atv: user.accessTokenVersion,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user.id, refreshToken);

    await this.auditService.createLog({
      actorId: user.id,
      action: AuditAction.REGISTER,
      targetType: 'USER',
      targetId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        permissions,
      },
    };
  }

  async login(loginDto: LoginDto, meta?: { ipAddress?: string }) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        user.status === UserStatus.SUSPENDED
          ? 'Account suspended'
          : 'Account banned',
      );
    }

    const permissions = resolvePermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      permissions,
      role: user.role.slug,
      atv: user.accessTokenVersion,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user.id, refreshToken);

    await this.auditService.createLog({
      actorId: user.id,
      action: AuditAction.LOGIN,
      targetType: 'USER',
      targetId: user.id,
      ipAddress: meta?.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        permissions,
      },
    };
  }

  async generateRefreshToken(user: RefreshClaimsUser): Promise<string> {
    const expiresIn = getRefreshExpiresIn();

    const refreshSignOptions: JwtSignOptions = {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn,
    };

    const permissions = resolvePermissions(user);

    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role.slug,
        permissions,
      },
      refreshSignOptions,
    );
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = getRefreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async refresh(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
            userPermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (
      !refreshTokenRecord ||
      refreshTokenRecord.revoked ||
      new Date() > refreshTokenRecord.expiresAt
    ) {
      throw new UnauthorizedException(
        'Invalid, expired, or revoked refresh token',
      );
    }

    try {
      this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    const user = refreshTokenRecord.user;

    if (user.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      });
      throw new UnauthorizedException(
        user.status === UserStatus.SUSPENDED
          ? 'Account suspended'
          : 'Account banned',
      );
    }

    const permissions = resolvePermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      permissions,
      role: user.role.slug,
      atv: user.accessTokenVersion,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(user);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { token },
        data: { revoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: getRefreshExpiresAt(),
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        permissions,
      },
    };
  }

  async logout(token: string): Promise<void> {
    if (!token) {
      return;
    }

    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshTokenRecord || refreshTokenRecord.revoked) {
      return;
    }

    const userId = refreshTokenRecord.userId;

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { token },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { accessTokenVersion: { increment: 1 } },
      }),
    ]);

    await this.auditService.createLog({
      actorId: userId,
      action: AuditAction.LOGOUT,
      targetType: 'USER',
      targetId: userId,
    });
  }
}
