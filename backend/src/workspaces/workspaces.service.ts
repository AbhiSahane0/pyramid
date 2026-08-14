import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser, type PublicUser } from '../users/user.mapper';

const memberInclude = {
  user: true,
} satisfies Prisma.MembershipInclude;

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: Date;
}

export interface WorkspaceMember extends PublicUser {
  role: WorkspaceRole;
  joinedAt: Date;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every workspace the user belongs to, with their role in each. */
  async findMine(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        workspace: { include: { _count: { select: { members: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      role: m.role,
      memberCount: m.workspace._count.members,
      createdAt: m.workspace.createdAt,
    }));
  }

  /** Creates a workspace with the creator as its OWNER, in one transaction. */
  async create(userId: string, name: string): Promise<WorkspaceSummary> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        members: { create: { userId, role: WorkspaceRole.OWNER } },
      },
      include: { _count: { select: { members: true } } },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      role: WorkspaceRole.OWNER,
      memberCount: workspace._count.members,
      createdAt: workspace.createdAt,
    };
  }

  /** `role` is the caller's own role, carried through so the client can keep
   * rendering the switcher without a second request. */
  async rename(
    workspaceId: string,
    name: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceSummary> {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
      include: { _count: { select: { members: true } } },
    });
    return {
      id: workspace.id,
      name: workspace.name,
      role,
      memberCount: workspace._count.members,
      createdAt: workspace.createdAt,
    };
  }

  async findMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId },
      include: memberInclude,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return memberships.map((m) => ({
      ...toPublicUser(m.user),
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Changes a member's role. The OWNER role is immovable: demoting the only
   * owner would leave the workspace with nobody able to manage it.
   */
  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Ownership cannot be granted; it belongs to the workspace creator',
      );
    }

    const target = await this.requireMembership(workspaceId, targetUserId);
    if (target.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('The workspace owner cannot be demoted');
    }
    if (targetUserId === actorId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const updated = await this.prisma.membership.update({
      where: { id: target.id },
      data: { role },
      include: memberInclude,
    });

    return {
      ...toPublicUser(updated.user),
      role: updated.role,
      joinedAt: updated.createdAt,
    };
  }

  /** Removes someone else from the workspace. The owner cannot be removed. */
  async removeMember(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
  ): Promise<void> {
    if (targetUserId === actorId) {
      throw new BadRequestException('Use "leave workspace" to remove yourself');
    }

    const target = await this.requireMembership(workspaceId, targetUserId);
    if (target.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('The workspace owner cannot be removed');
    }

    await this.prisma.membership.delete({ where: { id: target.id } });
  }

  /**
   * Leaves a workspace. The owner may not leave — they would strand the team,
   * so they delete the workspace instead.
   */
  async leave(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.requireMembership(workspaceId, userId);
    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'The owner cannot leave; delete the workspace instead',
      );
    }
    await this.prisma.membership.delete({ where: { id: membership.id } });
  }

  /** Deletes the workspace and, by cascade, its projects, tasks and invites. */
  async remove(workspaceId: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  /** Ensures every account has somewhere to work — used right after sign-up. */
  async ensurePersonalWorkspace(
    userId: string,
    displayName: string,
  ): Promise<string> {
    const existing = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing.workspaceId;

    const created = await this.create(userId, `${displayName}'s Workspace`);
    return created.id;
  }

  private async requireMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new NotFoundException(
        'That person is not a member of this workspace',
      );
    }
    return membership;
  }
}
