import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCESS_COOKIE } from '../auth.service';
import { JwtPayload } from '../types';

const cookieExtractor = (req: Request): string | null =>
  (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  /**
   * Resolves the JWT to a live user row so deleted users get 401s. A null
   * refresh-token hash means the session was revoked (logout / reuse
   * detection) — access tokens die with it instead of living out their TTL.
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Session is no longer active');
    }
    return user;
  }
}
