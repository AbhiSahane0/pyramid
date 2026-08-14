import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkspaceRole, type User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { resolveFrontendUrl } from '../common/frontend-url';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

/** How long an invite link stays usable. */
const INVITE_TTL_DAYS = 7;

export interface PendingInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string | null;
}

export interface CreatedInvitation extends PendingInvitation {
  /**
   * The raw token, returned exactly once at creation so the UI can offer a
   * copyable link. It is never stored and never readable again.
   */
  inviteUrl: string;
  emailed: boolean;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async create(
    workspaceId: string,
    invitedBy: User,
    email: string,
    role: WorkspaceRole,
  ): Promise<CreatedInvitation> {
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('A workspace has exactly one owner');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Already a member? Re-inviting is a no-op that would confuse the sender.
    const existingMember = await this.prisma.membership.findFirst({
      where: { workspaceId, user: { email: normalizedEmail } },
    });
    if (existingMember) {
      throw new BadRequestException('That person is already in this workspace');
    }

    // Supersede any outstanding invite for the same address, so the newest
    // link is the only one that works.
    await this.prisma.invitation.updateMany({
      where: {
        workspaceId,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: normalizedEmail,
        role,
        tokenHash: this.hash(token),
        expiresAt,
        workspaceId,
        invitedById: invitedBy.id,
      },
      include: { workspace: true },
    });

    const inviteUrl = `${resolveFrontendUrl(this.config.get<string>('FRONTEND_URL'))}/invite/${token}`;

    const emailed = await this.mail.sendWorkspaceInvite({
      to: normalizedEmail,
      inviterName: invitedBy.name,
      workspaceName: invitation.workspace.name,
      inviteUrl,
      expiresAt,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      invitedByName: invitedBy.name,
      inviteUrl,
      emailed,
    };
  }

  async findPending(workspaceId: string): Promise<PendingInvitation[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
      invitedByName: i.invitedBy?.name ?? null,
    }));
  }

  async revoke(workspaceId: string, invitationId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Describes an invite without consuming it, so the accept page can render
   * "X invited you to Y" before the user commits — and so a signed-out visitor
   * knows which account to sign in with.
   */
  async preview(token: string) {
    const invitation = await this.findUsable(token);
    return {
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      invitedByName: invitation.invitedBy?.name ?? null,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Consumes an invite for the signed-in user.
   *
   * The token is the credential, but acceptance is still bound to the invited
   * address: a forwarded link cannot be redeemed by somebody else.
   */
  async accept(token: string, user: User): Promise<{ workspaceId: string }> {
    const invitation = await this.findUsable(token);

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. Sign in with that account to accept it.`,
      );
    }
    if (user.isGuest) {
      throw new ForbiddenException(
        'Guest sessions are temporary — sign in with Google to join a workspace',
      );
    }

    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (!existing) {
      await this.prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      });
    }

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    this.logger.log(
      `User ${user.id} joined workspace ${invitation.workspaceId} via invitation`,
    );
    return { workspaceId: invitation.workspaceId };
  }

  /** Looks a token up by hash and rejects revoked, used or expired invites. */
  private async findUsable(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { workspace: true, invitedBy: { select: { name: true } } },
    });

    if (!invitation || invitation.revokedAt) {
      throw new NotFoundException('This invitation link is not valid');
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been used');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired');
    }
    return invitation;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
