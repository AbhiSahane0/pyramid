import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { toPublicUser } from '../users/user.mapper';
import type { PublicUser } from '../users/user.mapper';
import { AuthService, REFRESH_COOKIE } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { GoogleUser, RefreshRequestUser } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a temporary guest account and sign in' })
  async guestLogin(
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.authService.createGuest();
    const tokens = await this.authService.issueTokens(user);
    this.authService.setAuthCookies(res, tokens);
    return toPublicUser(user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start the Google OAuth 2.0 flow' })
  googleLogin(): void {
    // Guard redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback — sets cookies, redirects to app',
  })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const profile = req.user as GoogleUser;
      const user = await this.authService.loginWithGoogle(profile);
      const tokens = await this.authService.issueTokens(user);
      this.authService.setAuthCookies(res, tokens);
      res.redirect(`${this.authService.frontendUrl}/tasks`);
    } catch {
      res.redirect(`${this.authService.frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the token pair using the refresh cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const { userId, refreshToken } = req.user as RefreshRequestUser;
    const { user, tokens } = await this.authService.refresh(
      userId,
      refreshToken,
    );
    this.authService.setAuthCookies(res, tokens);
    return toPublicUser(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the session and clear auth cookies' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    await this.authService.logout(refreshToken);
    this.authService.clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() user: User): PublicUser {
    return toPublicUser(user);
  }
}
