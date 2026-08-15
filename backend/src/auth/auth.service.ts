import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { defaultAvatarUrl } from '../common/avatar';
import { resolveFrontendUrl } from '../common/frontend-url';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceSeedService } from '../seed/workspace-seed.service';
import type { GoogleUser, JwtPayload, TokenPair } from './types';
import { ttlToMs } from './ttl';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly workspaceSeed: WorkspaceSeedService,
  ) {}

  /**
   * Finds or creates the user for a Google profile. Real accounts start with
   * an empty workspace — only guest sessions get demo content.
   */
  async loginWithGoogle(profile: GoogleUser): Promise<User> {
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existingByGoogleId) {
      return this.prisma.user.update({
        where: { id: existingByGoogleId.id },
        data: {
          name: profile.name,
          // Only fill a gap. Overwriting on every login would silently undo a
          // picture the user chose in Settings.
          avatarUrl:
            existingByGoogleId.avatarUrl ??
            profile.avatarUrl ??
            defaultAvatarUrl(profile.email),
        },
      });
    }

    // Same email signed in with Google for the first time: link the account.
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          name: profile.name,
          avatarUrl:
            existingByEmail.avatarUrl ??
            profile.avatarUrl ??
            defaultAvatarUrl(profile.email),
        },
      });
    }

    // Real accounts start empty: the app's own empty states guide the user
    // into creating their first project/task. Only the shared member and
    // label catalogue is ensured so pickers are populated.
    const user = await this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl ?? defaultAvatarUrl(profile.email),
        username: profile.email.split('@')[0],
      },
    });
    await this.workspaceSeed.createPersonalWorkspace(user.id, user.name, false);
    return user;
  }

  /** Creates a temporary, clearly-flagged guest user with its own demo workspace. */
  async createGuest(): Promise<User> {
    const id = randomUUID().slice(0, 8);
    const user = await this.prisma.user.create({
      data: {
        email: `guest-${id}@guest.local`,
        name: 'Guest',
        username: `guest-${id}`,
        avatarUrl: defaultAvatarUrl(`guest-${id}`),
        isGuest: true,
      },
    });
    await this.workspaceSeed.createPersonalWorkspace(user.id, user.name, true);
    return user;
  }

  /** Signs a new access/refresh pair and stores the refresh token hash (rotation). */
  async issueTokens(user: User): Promise<TokenPair> {
    const basePayload = {
      sub: user.id,
      email: user.email,
      isGuest: user.isGuest,
    };
    const accessToken = this.jwt.sign(
      { ...basePayload, jti: randomUUID() } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ttlToMs(this.accessTtl) / 1000,
      },
    );
    const refreshToken = this.jwt.sign(
      { ...basePayload, jti: randomUUID() } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: ttlToMs(this.refreshTtl) / 1000,
      },
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: this.hash(refreshToken) },
    });
    return { accessToken, refreshToken };
  }

  /**
   * Rotates the token pair. The presented refresh token must match the stored
   * hash — a mismatch means it was already used (or forged), so the session
   * is revoked entirely.
   */
  async refresh(
    userId: string,
    presentedToken: string,
  ): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Session expired');
    }
    if (this.hash(presentedToken) !== user.hashedRefreshToken) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken: null },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  /** Invalidates the stored refresh token, if the presented one is valid. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      await this.prisma.user.updateMany({
        where: { id: payload.sub },
        data: { hashedRefreshToken: null },
      });
    } catch {
      // Invalid/expired token — nothing to revoke.
    }
  }

  setAuthCookies(res: Response, tokens: TokenPair): void {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.cookieOptions(),
      maxAge: ttlToMs(this.accessTtl),
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.cookieOptions(),
      maxAge: ttlToMs(this.refreshTtl),
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  get googleConfigured(): boolean {
    return Boolean(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

  get frontendUrl(): string {
    return resolveFrontendUrl(this.config.get<string>('FRONTEND_URL'));
  }

  private get accessTtl(): string {
    return this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
  }

  private get refreshTtl(): string {
    return this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
  }

  /**
   * The frontend proxies /api/* to this server (Next.js rewrites), so cookies
   * are always first-party on the frontend origin — SameSite=Lax works in
   * both dev and prod, with no cross-site cookie caveats.
   */
  private cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
