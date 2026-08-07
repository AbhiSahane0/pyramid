import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REFRESH_COOKIE } from '../auth.service';
import { JwtPayload, RefreshRequestUser } from '../types';

const cookieExtractor = (req: Request): string | null =>
  (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ?? null;

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /** Passes the raw token through so the service can verify it against the stored hash. */
  validate(req: Request, payload: JwtPayload): RefreshRequestUser {
    const refreshToken = cookieExtractor(req);
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, refreshToken };
  }
}
