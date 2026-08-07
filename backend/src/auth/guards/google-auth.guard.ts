import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from '../auth.service';

/**
 * Wraps the passport Google guard so OAuth failures (user denied consent,
 * invalid code, unconfigured credentials) redirect back to the login page
 * with a readable error instead of surfacing a raw 401 JSON page.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const res = context.switchToHttp().getResponse<Response>();
    const loginUrl = `${this.authService.frontendUrl}/login`;

    if (!this.authService.googleConfigured) {
      res.redirect(`${loginUrl}?error=oauth_unconfigured`);
      return false;
    }

    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      res.redirect(`${loginUrl}?error=oauth_failed`);
      return false;
    }
  }
}
