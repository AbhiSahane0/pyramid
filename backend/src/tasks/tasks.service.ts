import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { Prisma, Priority, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const memberSelect = {
  select: { id: true, name: true, avatarUrl: true, title: true },
} as const;

const listInclude = {
  column: { select: { id: true, name: true, color: true, position: true } },
  members: memberSelect,
  labels: true,
  reporter: memberSelect,
  project: { select: { id: true, name: true } },
  _count: { select: { subtasks: true, comments: true } },
} satisfies Prisma.TaskInclude;

const detailInclude = {
  ...listInclude,
  parent: { select: { id: true, title: true } },
  subtasks: {
    include: { members: memberSelect, labels: true },
    orderBy: { position: 'asc' },
  },
  comments: {
    where: { parentId: null },
    include: {
      author: memberSelect,
      replies: {
        include: { author: memberSelect },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  activities: {
    include: { actor: memberSelect },
    orderBy: { createdAt: 'desc' },
    take: 20,
  },
  resources: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.TaskInclude;

export type TaskListItem = Prisma.TaskGetPayload<{
  include: typeof listInclude;
}>;
export type TaskDetail = Prisma.TaskGetPayload<{
  include: typeof detailInclude;
}>;

const PRIORITY_LABELS: Record<Priority, string> = {
  NO_PRIORITY: 'No priority',
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string, query: TaskQueryDto): Promise<TaskListItem[]> {
    const where: Prisma.TaskWhereInput = {
      workspaceId,
      parentId: null,
      columnId: query.columnId,
      priority: query.priority,
      projectId: query.projectId,
      reporterId: query.reporterId,
      members: query.memberId ? { some: { id: query.memberId } } : undefined,
      labels: query.labelId ? { some: { id: query.labelId } } : undefined,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    return this.prisma.task.findMany({
      where,
      include: listInclude,
      orderBy: [{ column: { position: 'asc' } }, { position: 'asc' }],
    });
  }

  async findOne(workspaceId: string, id: string): Promise<TaskDetail> {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
      include: detailInclude,
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(
    workspaceId: string,
    actorId: string,
    dto: CreateTaskDto,
  ): Promise<TaskDetail> {
    const columnId = dto.columnId
      ? await this.requireColumn(workspaceId, dto.columnId)
      : await this.firstColumn(workspaceId);
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        columnId,
        priority: dto.priority ?? Priority.NO_PRIORITY,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        position: await this.nextPosition(workspaceId, columnId, dto.parentId),
        workspaceId,
        createdById: actorId,
        projectId: dto.projectId,
        parentId: dto.parentId,
        reporterId: dto.reporterId ?? actorId,
        members: dto.memberIds
          ? { connect: dto.memberIds.map((id) => ({ id })) }
          : undefined,
        labels: dto.labelIds
          ? { connect: dto.labelIds.map((id) => ({ id })) }
          : undefined,
      },
      include: detailInclude,
    });
    return task;
  }

  async update(
    workspaceId: string,
    actorId: string,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDetail> {
    const existing = await this.requireInWorkspace(workspaceId, id);

    const data: Prisma.TaskUpdateInput = {
      title: dto.title,
      description: dto.description,
      column: dto.columnId ? { connect: { id: dto.columnId } } : undefined,
      priority: dto.priority,
      startDate:
        dto.startDate === undefined
          ? undefined
          : dto.startDate === null
            ? null
            : new Date(dto.startDate),
      dueDate:
        dto.dueDate === undefined
          ? undefined
          : dto.dueDate === null
            ? null
            : new Date(dto.dueDate),
      project:
        dto.projectId === undefined
          ? undefined
          : dto.projectId === null
            ? { disconnect: true }
            : { connect: { id: dto.projectId } },
      reporter:
        dto.reporterId === undefined
          ? undefined
          : dto.reporterId === null
            ? { disconnect: true }
            : { connect: { id: dto.reporterId } },
      members: dto.memberIds
        ? { set: dto.memberIds.map((id) => ({ id })) }
        : undefined,
      labels: dto.labelIds
        ? { set: dto.labelIds.map((id) => ({ id })) }
        : undefined,
    };

    // Column changed outside drag & drop: append to the end of the new one.
    if (dto.columnId && dto.columnId !== existing.columnId) {
      await this.requireColumn(workspaceId, dto.columnId);
      data.position = await this.nextPosition(
        workspaceId,
        dto.columnId,
        existing.parentId,
      );
    }

    // Log before fetching the updated detail so the response includes the
    // fresh activity entries.
    await this.logChanges(existing, dto, actorId);

    return this.prisma.task.update({
      where: { id },
      data,
      include: detailInclude,
    });
  }

  async move(
    workspaceId: string,
    actorId: string,
    id: string,
    dto: MoveTaskDto,
  ): Promise<Task> {
    const existing = await this.requireInWorkspace(workspaceId, id);
    await this.requireColumn(workspaceId, dto.columnId);
    const task = await this.prisma.task.update({
      where: { id },
      data: { columnId: dto.columnId, position: dto.position },
    });
    if (existing.columnId !== dto.columnId) {
      await this.prisma.activity.create({
        data: {
          taskId: id,
          actorId,
          type: 'status_changed',
          meta: await this.columnChangeMeta(existing.columnId, dto.columnId),
        },
      });
    }
    return task;
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.requireInWorkspace(workspaceId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  // --- Comments ---

  async addComment(
    workspaceId: string,
    authorId: string,
    taskId: string,
    dto: CreateCommentDto,
  ) {
    await this.requireInWorkspace(workspaceId, taskId);
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, taskId },
      });
      if (!parent) {
        throw new NotFoundException('Comment being replied to was not found');
      }
    }
    return this.prisma.comment.create({
      data: {
        body: dto.body,
        taskId,
        authorId,
        parentId: dto.parentId,
      },
      include: { author: memberSelect },
    });
  }

  /**
   * Authors delete their own comments; workspace admins can moderate anyone's.
   * `canModerate` is derived from the caller's role by the controller.
   */
  async deleteComment(
    workspaceId: string,
    actorId: string,
    commentId: string,
    canModerate: boolean,
  ): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { workspaceId: true } } },
    });
    if (!comment || comment.task.workspaceId !== workspaceId) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== actorId && !canModerate) {
      throw new ForbiddenException('You cannot delete this comment');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  // --- Resources ---

  async addResource(
    workspaceId: string,
    taskId: string,
    dto: CreateResourceDto,
  ) {
    await this.requireInWorkspace(workspaceId, taskId);
    return this.prisma.resource.create({
      data: { name: dto.name, url: dto.url, taskId },
    });
  }

  async removeResource(workspaceId: string, resourceId: string): Promise<void> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { task: { select: { workspaceId: true } } },
    });
    if (!resource || resource.task.workspaceId !== workspaceId) {
      throw new NotFoundException('Resource not found');
    }
    await this.prisma.resource.delete({ where: { id: resourceId } });
  }

  // --- Helpers ---

  /** 404 rather than 403 for another workspace's task: never confirm it exists. */
  private async requireInWorkspace(
    workspaceId: string,
    id: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  /**
   * Proves a column belongs to this workspace before a task is pointed at it.
   * Without this a task could be parked in another team's column — the foreign
   * key alone only checks that the column exists.
   */
  private async requireColumn(
    workspaceId: string,
    columnId: string,
  ): Promise<string> {
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, workspaceId },
      select: { id: true },
    });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column.id;
  }

  /** The leftmost column — where a task lands when none is named. */
  private async firstColumn(workspaceId: string): Promise<string> {
    const column = await this.prisma.boardColumn.findFirst({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    if (!column) {
      throw new BadRequestException(
        'This workspace has no columns — add one before creating tasks',
      );
    }
    return column.id;
  }

  /** Column names for the activity feed, read at the time of the change. */
  private async columnChangeMeta(
    fromId: string,
    toId: string,
  ): Promise<{ from: string; to: string }> {
    const columns = await this.prisma.boardColumn.findMany({
      where: { id: { in: [fromId, toId] } },
      select: { id: true, name: true },
    });
    const nameOf = (id: string) =>
      columns.find((column) => column.id === id)?.name ?? 'Unknown';
    return { from: nameOf(fromId), to: nameOf(toId) };
  }

  /** Next position at the end of a column (or subtask list). */
  private async nextPosition(
    workspaceId: string,
    columnId: string,
    parentId?: string | null,
  ): Promise<number> {
    const last = await this.prisma.task.findFirst({
      where: { workspaceId, columnId, parentId: parentId ?? null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 1000;
  }

  private async logChanges(
    existing: Task,
    dto: UpdateTaskDto,
    actorId: string,
  ): Promise<void> {
    const entries: Prisma.ActivityCreateManyInput[] = [];
    if (dto.columnId && dto.columnId !== existing.columnId) {
      entries.push({
        taskId: existing.id,
        actorId,
        type: 'status_changed',
        meta: await this.columnChangeMeta(existing.columnId, dto.columnId),
      });
    }
    if (dto.priority && dto.priority !== existing.priority) {
      entries.push({
        taskId: existing.id,
        actorId,
        type: 'priority_changed',
        meta: {
          from: PRIORITY_LABELS[existing.priority],
          to: PRIORITY_LABELS[dto.priority],
        },
      });
    }
    if (entries.length > 0) {
      await this.prisma.activity.createMany({ data: entries });
    }
  }
}
