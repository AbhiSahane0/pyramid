import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole, type Membership, type User } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  hasAtLeast,
  WORKSPACE_HEADER,
  type WorkspaceContext,
} from './workspace-context';
import { REQUIRED_ROLE } from './require-role.decorator';

type ScopedRequest = Request & {
  user: User;
  workspace?: WorkspaceContext;
};

/**
 * Resolves the workspace a request targets and proves the caller belongs to it.
 *
 * The id comes from the `x-workspace-id` header. Without it the workspace is
 * only inferred when the caller belongs to exactly one — then there is nothing
 * to guess. Someone who belongs to several gets 400, because picking one for
 * them is how an invited member ends up staring at their own empty board
 * instead of the team they just joined: their sign-up workspace is the older
 * membership, so any "first" rule quietly chooses wrong.
 *
 * A non-member gets 404 rather than 403 — a 403 would confirm the workspace
 * exists, which is the same reasoning used for tasks.
 *
 * Runs after JwtAuthGuard, so `req.user` is already populated.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const header = request.headers[WORKSPACE_HEADER];
    const requestedId = Array.isArray(header) ? header[0] : header;

    let membership: Membership | null;
    if (requestedId) {
      membership = await this.prisma.membership.findUnique({
        where: {
          userId_workspaceId: { userId: user.id, workspaceId: requestedId },
        },
      });
    } else {
      const memberships = await this.prisma.membership.findMany({
        where: { userId: user.id },
        take: 2,
      });
      if (memberships.length > 1) {
        throw new BadRequestException(
          `You belong to more than one workspace — send the ${WORKSPACE_HEADER} header to say which one`,
        );
      }
      membership = memberships[0] ?? null;
    }

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    request.workspace = {
      workspaceId: membership.workspaceId,
      role: membership.role,
    };

    const required = this.reflector.getAllAndOverride<
      WorkspaceRole | undefined
    >(REQUIRED_ROLE, [context.getHandler(), context.getClass()]);
    if (required && !hasAtLeast(membership.role, required)) {
      throw new ForbiddenException(
        `This action requires the ${required.toLowerCase()} role`,
      );
    }

    return true;
  }
}
