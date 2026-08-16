import { Injectable, Logger } from '@nestjs/common';
import { Label, User, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COLUMNS, POSITION_STEP } from '../columns/board-colors';
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

  /**
   * Every account needs somewhere to work, so sign-up creates a workspace with
   * the new user as its OWNER.
   *
   * It is deliberately not named after its creator: a workspace is a team, and
   * naming it "Dexter's Workspace" makes it read as personal property right up
   * until the moment someone else is invited into it. "Untitled" invites the
   * rename that Settings already supports.
   *
   * Guests get the demo content (they exist to show the app off); real accounts
   * start empty and meet the app's own empty states instead of someone else's
   * sample data.
   */
  async createPersonalWorkspace(
    userId: string,
    withDemoContent: boolean,
  ): Promise<string> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: 'Untitled Workspace',
        members: { create: { userId, role: WorkspaceRole.OWNER } },
        // Every board needs somewhere to put a task, so the shipped five come
        // with the workspace. They are ordinary rows — rename, recolour,
        // reorder or replace them.
        columns: {
          create: DEFAULT_COLUMNS.map((column, index) => ({
            ...column,
            position: (index + 1) * POSITION_STEP,
          })),
        },
      },
    });

    if (withDemoContent) {
      await this.seedForWorkspace(workspace.id, userId);
    } else {
      // Still ensure the shared member/label catalogue exists so the pickers
      // are populated on an otherwise empty board.
      await this.seedGlobals();
    }

    return workspace.id;
  }

  /**
   * Fills a brand-new workspace with the demo content from the design.
   * `actorId` is the person who triggered it — used for attribution only.
   */
  async seedForWorkspace(workspaceId: string, actorId: string): Promise<void> {
    const { members, labels } = await this.seedGlobals();

    const columns = await this.prisma.boardColumn.findMany({
      where: { workspaceId },
      select: { id: true, name: true, position: true },
      orderBy: { position: 'asc' },
    });
    const columnByName = new Map(columns.map((c) => [c.name, c.id]));
    const fallbackColumnId = columns[0].id;
    const columnFor = (name: string) =>
      columnByName.get(name) ?? fallbackColumnId;

    const projectByName = new Map<string, string>();
    for (const p of DEMO_PROJECTS) {
      const project = await this.prisma.project.create({
        data: {
          name: p.name,
          priority: p.priority,
          dueDate: new Date(p.dueDate),
          workspaceId,
          createdById: actorId,
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
          columnId: columnFor(t.column),
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          position,
          workspaceId,
          createdById: actorId,
          reporterId: t.reporterKey ? members.get(t.reporterKey)?.id : actorId,
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
            columnId: task.columnId,
            priority: s.priority,
            dueDate: new Date(s.dueDate),
            position: subPosition,
            workspaceId,
            createdById: actorId,
            parentId: task.id,
            reporterId: actorId,
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
              actorId,
              type: 'update_posted',
              meta: { text: 'posted an update' },
            },
            {
              taskId: task.id,
              actorId,
              type: 'priority_changed',
              meta: { from: 'No priority', to: 'High' },
            },
          ],
        });
      }
    }

    this.logger.log(`Seeded demo content into workspace ${workspaceId}`);
  }
}
