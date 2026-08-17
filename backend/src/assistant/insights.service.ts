import { Injectable } from '@nestjs/common';
import { Prisma, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Every question the assistant can answer, as ordinary database queries.
 *
 * The model never sees the database and never writes a query — it picks one of
 * these and supplies arguments. Two reasons. Counting is arithmetic, and a
 * language model doing arithmetic over a list it was handed will occasionally
 * be confidently wrong; Postgres will not. And `workspaceId` is a parameter
 * here, passed from the request guard, so there is no phrasing of a question
 * that reaches another workspace's tasks.
 */

export interface TaskFilter {
  assigneeId?: string;
  columnId?: string;
  /**
   * One priority or several. "Critical" means URGENT *and* HIGH, and a single
   * value cannot express that — the model would have to run two counts and add
   * them, which is exactly the arithmetic these tools exist to avoid.
   */
  priority?: Priority | Priority[];
  projectId?: string;
  labelId?: string;
  /** true = only unfinished work, false = only finished. */
  open?: boolean;
  /** Past its due date. Combines with `open` for the usual reading. */
  overdue?: boolean;
  /** Has nobody assigned. */
  unassigned?: boolean;
}

export interface TaskSummary {
  id: string;
  title: string;
  column: string;
  priority: Priority;
  dueDate: string | null;
  assignees: string[];
  project: string | null;
}

const MAX_ROWS = 25;

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The board's shape: what the columns are called and which mean finished. */
  async columns(workspaceId: string) {
    const columns = await this.prisma.boardColumn.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
    return columns.map((column) => ({
      id: column.id,
      name: column.name,
      isDone: column.isDone,
      taskCount: column._count.tasks,
    }));
  }

  /**
   * Everyone who can hold a task here, so the model can turn "Rahul" into an
   * id. Matching a name to a person is exactly what a language model is good
   * at, and exactly what a LIKE query is bad at.
   */
  async members(workspaceId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { memberships: { some: { workspaceId } } },
          { memberTasks: { some: { workspaceId } } },
        ],
      },
      select: { id: true, name: true, email: true, title: true },
      orderBy: { name: 'asc' },
    });
    return users;
  }

  /**
   * Confirms an assignee id belongs to this workspace.
   *
   * Without this the model can pass an id for a person who is not here — or
   * one it invented for a name nobody has — and get an honest count of zero
   * back, which it then reports as "Rahul has 0 tasks". A zero and a
   * non-existent person are different answers, and only one of them is true.
   */
  async unknownAssignee(
    workspaceId: string,
    assigneeId: string,
  ): Promise<{ error: string; knownMembers: string[] } | null> {
    const members = await this.members(workspaceId);
    if (members.some((member) => member.id === assigneeId)) return null;
    return {
      error: 'No such person in this workspace. Say so; do not report a count.',
      knownMembers: members.map((member) => member.name),
    };
  }

  async countTasks(workspaceId: string, filter: TaskFilter): Promise<number> {
    return this.prisma.task.count({ where: this.where(workspaceId, filter) });
  }

  async findTasks(
    workspaceId: string,
    filter: TaskFilter,
  ): Promise<{ tasks: TaskSummary[]; total: number; notShown: number }> {
    const where = this.where(workspaceId, filter);
    const [total, rows] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        take: MAX_ROWS,
        orderBy: [
          { dueDate: { sort: 'asc', nulls: 'last' } },
          { position: 'asc' },
        ],
        include: {
          column: { select: { name: true } },
          members: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
    ]);

    return {
      total,
      // Computed here rather than left as total-minus-listed for the model to
      // work out: it read "total" as the hidden count and announced five
      // missing tasks when every one was on screen.
      notShown: Math.max(0, total - rows.length),
      tasks: rows.map((task) => ({
        id: task.id,
        title: task.title,
        column: task.column.name,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
        assignees: task.members.map((member) => member.name),
        project: task.project?.name ?? null,
      })),
    };
  }

  /**
   * Open tasks per person, for "who has the most on". Counted in the database
   * and returned already sorted, so the answer does not depend on the model
   * tallying a list correctly.
   */
  async workload(workspaceId: string, options: { open?: boolean } = {}) {
    const where = this.where(workspaceId, { open: options.open ?? true });
    const members = await this.prisma.user.findMany({
      where: { memberTasks: { some: { workspaceId } } },
      select: {
        id: true,
        name: true,
        _count: { select: { memberTasks: { where } } },
      },
    });

    const unassigned = await this.prisma.task.count({
      where: { ...where, members: { none: {} } },
    });

    return {
      members: members
        .map((member) => ({
          name: member.name,
          taskCount: member._count.memberTasks,
        }))
        .sort((a, b) => b.taskCount - a.taskCount),
      unassigned,
    };
  }

  /**
   * What moved into a finished column, and when.
   *
   * Read from the activity log rather than a timestamp on the task, so it
   * answers about work completed before this feature existed. The log stores
   * the column's name as it was at the time, which is why both the current
   * done-column names and any historical ones are matched.
   */
  async completed(
    workspaceId: string,
    options: { sinceDays?: number; actorId?: string } = {},
  ) {
    const since = new Date();
    since.setDate(since.getDate() - (options.sinceDays ?? 7));

    const doneNames = (await this.columns(workspaceId))
      .filter((column) => column.isDone)
      .map((column) => column.name);

    const activities = await this.prisma.activity.findMany({
      where: {
        type: 'status_changed',
        createdAt: { gte: since },
        actorId: options.actorId,
        task: { workspaceId },
      },
      include: {
        task: { select: { id: true, title: true } },
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const completions = activities.filter((activity) => {
      const to = (activity.meta as { to?: string } | null)?.to;
      return typeof to === 'string' && doneNames.includes(to);
    });

    // One task finished twice in the window is one completion, not two.
    const seen = new Set<string>();
    const unique = completions.filter((activity) => {
      if (seen.has(activity.taskId)) return false;
      seen.add(activity.taskId);
      return true;
    });

    return {
      sinceDays: options.sinceDays ?? 7,
      total: unique.length,
      completions: unique.slice(0, MAX_ROWS).map((activity) => ({
        title: activity.task.title,
        by: activity.actor?.name ?? 'Unknown',
        movedTo: (activity.meta as { to?: string } | null)?.to ?? 'Done',
        at: activity.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  /** A one-shot picture of the board, for open-ended "how are we doing" asks. */
  async overview(workspaceId: string) {
    const [columns, workload, overdue, dueSoon, unassigned] = await Promise.all(
      [
        this.columns(workspaceId),
        this.workload(workspaceId),
        this.countTasks(workspaceId, { overdue: true, open: true }),
        this.dueWithin(workspaceId, 7),
        this.countTasks(workspaceId, { unassigned: true, open: true }),
      ],
    );

    return {
      columns,
      openTasks: columns
        .filter((column) => !column.isDone)
        .reduce((sum, column) => sum + column.taskCount, 0),
      overdue,
      dueWithin7Days: dueSoon,
      unassigned,
      busiest: workload.members.slice(0, 5),
    };
  }

  private async dueWithin(workspaceId: string, days: number): Promise<number> {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const where = this.where(workspaceId, { open: true });
    return this.prisma.task.count({
      where: { ...where, dueDate: { gte: new Date(), lte: until } },
    });
  }

  /** Translates a filter into Prisma's shape, always pinned to the workspace. */
  private where(
    workspaceId: string,
    filter: TaskFilter,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = {
      workspaceId,
      // Subtasks would double-count against their parent in every total.
      parentId: null,
      columnId: filter.columnId,
      priority: Array.isArray(filter.priority)
        ? { in: filter.priority }
        : filter.priority,
      projectId: filter.projectId,
    };

    if (filter.assigneeId) {
      where.members = { some: { id: filter.assigneeId } };
    }
    if (filter.unassigned) {
      where.members = { none: {} };
    }
    if (filter.labelId) {
      where.labels = { some: { id: filter.labelId } };
    }
    if (filter.open !== undefined) {
      where.column = { isDone: !filter.open };
    }
    if (filter.overdue) {
      where.dueDate = { lt: new Date() };
      // Work that is finished is not overdue, whatever its due date says.
      where.column = { isDone: false };
    }

    return where;
  }
}
