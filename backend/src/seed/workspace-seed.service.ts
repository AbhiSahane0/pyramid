import { Injectable, Logger } from '@nestjs/common';
import { Label, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEMO_LABELS,
  DEMO_MEMBERS,
  DEMO_PROJECTS,
  DEMO_TASKS,
} from './demo-data';

/**
 * Populates a brand-new account with the demo workspace from the Figma
 * design: shared member personas + labels (global), and the user's own
 * projects/tasks/subtasks/comments/activity.
 */
@Injectable()
export class WorkspaceSeedService {
  private readonly logger = new Logger(WorkspaceSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Upserts the global demo member personas and labels. Idempotent. */
  async seedGlobals(): Promise<{
    members: Map<string, User>;
    labels: Map<string, Label>;
  }> {
    const members = new Map<string, User>();
    for (const m of DEMO_MEMBERS) {
      const user = await this.prisma.user.upsert({
        where: { email: m.email },
        update: { name: m.name, title: m.title, avatarUrl: m.avatarUrl },
        create: {
          email: m.email,
          name: m.name,
          title: m.title,
          avatarUrl: m.avatarUrl,
          isDemo: true,
        },
      });
      members.set(m.key, user);
    }

    const labels = new Map<string, Label>();
    for (const name of DEMO_LABELS) {
      const label = await this.prisma.label.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      labels.set(name, label);
    }

    return { members, labels };
  }

  /** Creates the demo projects and tasks owned by the given user. */
  async seedForUser(ownerId: string): Promise<void> {
    const { members, labels } = await this.seedGlobals();

    const projectByName = new Map<string, string>();
    for (const p of DEMO_PROJECTS) {
      const project = await this.prisma.project.create({
        data: {
          name: p.name,
          priority: p.priority,
          dueDate: new Date(p.dueDate),
          ownerId,
          leadId: p.leadKey ? members.get(p.leadKey)?.id : undefined,
        },
      });
      projectByName.set(p.name, project.id);
    }

    let position = 0;
    for (const t of DEMO_TASKS) {
      position += 1000;
      const task = await this.prisma.task.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          position,
          ownerId,
          reporterId: t.reporterKey ? members.get(t.reporterKey)?.id : ownerId,
          projectId: t.projectName
            ? projectByName.get(t.projectName)
            : undefined,
          members: {
            connect: t.memberKeys
              .map((k) => members.get(k))
              .filter((u): u is User => Boolean(u))
              .map((u) => ({ id: u.id })),
          },
          labels: {
            connect: t.labels
              .map((name) => labels.get(name))
              .filter((l): l is Label => Boolean(l))
              .map((l) => ({ id: l.id })),
          },
        },
      });

      let subPosition = 0;
      for (const s of t.subtasks ?? []) {
        subPosition += 1000;
        await this.prisma.task.create({
          data: {
            title: s.title,
            status: task.status,
            priority: s.priority,
            dueDate: new Date(s.dueDate),
            position: subPosition,
            ownerId,
            parentId: task.id,
            reporterId: ownerId,
            members: s.memberKey
              ? { connect: { id: members.get(s.memberKey)!.id } }
              : undefined,
          },
        });
      }

      if (t.comment) {
        await this.prisma.comment.create({
          data: {
            body: t.comment.body,
            taskId: task.id,
            authorId: members.get(t.comment.authorKey)!.id,
          },
        });
      }

      if (t.title === 'Write API Documentation') {
        await this.prisma.activity.createMany({
          data: [
            {
              taskId: task.id,
              actorId: ownerId,
              type: 'update_posted',
              meta: { text: 'posted an update' },
            },
            {
              taskId: task.id,
              actorId: ownerId,
              type: 'priority_changed',
              meta: { from: 'No priority', to: 'High' },
            },
          ],
        });
      }
    }

    this.logger.log(`Seeded demo workspace for user ${ownerId}`);
  }
}
