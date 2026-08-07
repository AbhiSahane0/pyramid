import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Demo personas + the current user — everyone who can be assigned to a task. */
  async findAssignableMembers(currentUserId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { OR: [{ isDemo: true }, { id: currentUserId }] },
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
