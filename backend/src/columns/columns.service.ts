import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardColumn, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { POSITION_STEP } from './board-colors';
import {
  CreateColumnDto,
  DeleteColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from './dto/column.dto';

export type ColumnWithCount = BoardColumn & { _count: { tasks: number } };

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string): Promise<ColumnWithCount[]> {
    return this.prisma.boardColumn.findMany({
      where: { workspaceId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { position: 'asc' },
    });
  }

  async create(
    workspaceId: string,
    dto: CreateColumnDto,
  ): Promise<ColumnWithCount> {
    const name = dto.name.trim();
    const last = await this.prisma.boardColumn.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    try {
      return await this.prisma.boardColumn.create({
        data: {
          name,
          color: dto.color ?? 'slate',
          position: (last?.position ?? 0) + POSITION_STEP,
          workspaceId,
        },
        include: { _count: { select: { tasks: true } } },
      });
    } catch (error) {
      throw this.asFriendlyError(error, name);
    }
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateColumnDto,
  ): Promise<ColumnWithCount> {
    await this.require(workspaceId, id);
    const name = dto.name?.trim();
    try {
      return await this.prisma.boardColumn.update({
        where: { id },
        data: { name, color: dto.color },
        include: { _count: { select: { tasks: true } } },
      });
    } catch (error) {
      throw this.asFriendlyError(error, name ?? '');
    }
  }

  /**
   * Rewrites every position from one ordered list, so the result is exactly
   * what the client showed. Partial payloads would leave the board in an order
   * nobody chose.
   */
  async reorder(
    workspaceId: string,
    dto: ReorderColumnsDto,
  ): Promise<ColumnWithCount[]> {
    const columns = await this.prisma.boardColumn.findMany({
      where: { workspaceId },
      select: { id: true },
    });
    const known = new Set(columns.map((column) => column.id));
    const given = new Set(dto.columnIds);

    if (given.size !== dto.columnIds.length) {
      throw new BadRequestException('The same column was listed twice');
    }
    if (
      given.size !== known.size ||
      dto.columnIds.some((id) => !known.has(id))
    ) {
      throw new BadRequestException(
        'Send every column in the workspace, in the order to display',
      );
    }

    await this.prisma.$transaction(
      dto.columnIds.map((id, index) =>
        this.prisma.boardColumn.update({
          where: { id },
          data: { position: (index + 1) * POSITION_STEP },
        }),
      ),
    );
    return this.findAll(workspaceId);
  }

  /**
   * Deleting a column must not delete the work in it: the caller says where
   * the tasks go, and the two writes share a transaction so a failure can
   * never leave tasks pointing at a column that is gone.
   */
  async remove(
    workspaceId: string,
    id: string,
    dto: DeleteColumnDto,
  ): Promise<void> {
    const column = await this.require(workspaceId, id);
    const total = await this.prisma.boardColumn.count({
      where: { workspaceId },
    });
    if (total <= 1) {
      throw new BadRequestException(
        'A board needs at least one column — add another before deleting this one',
      );
    }

    const taskCount = await this.prisma.task.count({ where: { columnId: id } });
    if (taskCount > 0) {
      if (!dto.moveTasksTo) {
        throw new BadRequestException(
          `“${column.name}” holds ${taskCount} ${
            taskCount === 1 ? 'task' : 'tasks'
          } — say which column they should move to`,
        );
      }
      if (dto.moveTasksTo === id) {
        throw new BadRequestException(
          'Tasks cannot be moved into the column being deleted',
        );
      }
      await this.require(workspaceId, dto.moveTasksTo);
    }

    await this.prisma.$transaction([
      ...(taskCount > 0 && dto.moveTasksTo
        ? [
            this.prisma.task.updateMany({
              where: { columnId: id },
              data: { columnId: dto.moveTasksTo },
            }),
          ]
        : []),
      this.prisma.boardColumn.delete({ where: { id } }),
    ]);
  }

  private async require(workspaceId: string, id: string): Promise<BoardColumn> {
    const column = await this.prisma.boardColumn.findFirst({
      where: { id, workspaceId },
    });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }

  /** Turns the unique-name violation into something a user can act on. */
  private asFriendlyError(error: unknown, name: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(`This board already has a “${name}” column`);
    }
    return error;
  }
}
