import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Everyone who can be put on a task in this workspace: its members, plus
   * anyone already assigned to or reporting one of its tasks.
   *
   * That second clause is what keeps the guest tour intact — the demo personas
   * (Admin, Designer, QA Team…) can never sign in, so they hold no membership,
   * but they own the seeded cards and their names have to resolve. A real
   * workspace has no such tasks, so it sees only its own people.
   */
  async findAssignableMembers(workspaceId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { memberships: { some: { workspaceId } } },
          { memberTasks: { some: { workspaceId } } },
          { reportedTasks: { some: { workspaceId } } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  /**
   * "Leave Workspace": deletes the account and, via cascades, every project,
   * task, comment and activity the user owns.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
