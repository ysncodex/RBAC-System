import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from './utils/auth-cookie';

function readRefreshCookie(req: Request): string | undefined {
  const raw = req.cookies?.refreshToken as string | string[] | undefined;
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const result = await this.authService.login(loginDto, { ipAddress });

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @SkipThrottle()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = readRefreshCookie(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const result = await this.authService.refresh(refreshToken);

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @SkipThrottle()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = readRefreshCookie(req);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', clearRefreshCookieOptions());

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
