import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface WorkspaceInviteMail {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  expiresAt: Date;
}

/**
 * Transactional email via Resend.
 *
 * Delivery is optional by design: with no RESEND_API_KEY the service logs the
 * link instead of failing, so invitations work end to end in development and in
 * any deployment where email isn't configured yet. Same approach as the Google
 * OAuth credentials — a missing integration degrades, it doesn't break.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from =
      this.config.get<string>('MAIL_FROM') ?? 'Pyramid <onboarding@resend.dev>';

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set — invitation emails will be logged instead of sent',
      );
    }
  }

  /** Returns whether the message actually left the building. */
  async sendWorkspaceInvite(invite: WorkspaceInviteMail): Promise<boolean> {
    const subject = `${invite.inviterName} invited you to ${invite.workspaceName} on Pyramid`;

    if (!this.resend) {
      this.logger.log(
        `[email disabled] Invite for ${invite.to} → ${invite.inviteUrl}`,
      );
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: invite.to,
        subject,
        html: this.inviteHtml(invite),
        text:
          `${invite.inviterName} invited you to join "${invite.workspaceName}" on Pyramid.\n\n` +
          `Accept: ${invite.inviteUrl}\n\n` +
          `This link expires on ${invite.expiresAt.toDateString()}.`,
      });

      if (error) {
        // A failed send must not fail the request: the invitation row exists
        // and the inviter can still copy the link from the UI.
        this.logger.error(
          `Resend rejected the invite to ${invite.to}`,
          error.message,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Could not send the invite to ${invite.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  private inviteHtml(invite: WorkspaceInviteMail): string {
    return `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#18181b">
  <h1 style="font-size:20px;margin:0 0 16px">You've been invited to ${escapeHtml(invite.workspaceName)}</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#52525b">
    ${escapeHtml(invite.inviterName)} has invited you to collaborate on
    <strong>${escapeHtml(invite.workspaceName)}</strong> in Pyramid.
  </p>
  <a href="${invite.inviteUrl}"
     style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
    Accept invitation
  </a>
  <p style="font-size:13px;line-height:1.6;margin:24px 0 0;color:#71717a">
    This link expires on ${invite.expiresAt.toDateString()} and can only be used once.
    If you weren't expecting it, you can ignore this email.
  </p>
</div>`.trim();
  }
}

/** Invite content includes user-supplied names, so escape before interpolating. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
