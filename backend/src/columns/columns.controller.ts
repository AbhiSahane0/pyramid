import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspace } from '../workspaces/current-workspace.decorator';
import { RequireRole } from '../workspaces/require-role.decorator';
import type { WorkspaceContext } from '../workspaces/workspace-context';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { ColumnsService, type ColumnWithCount } from './columns.service';
import {
  CreateColumnDto,
  DeleteColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from './dto/column.dto';

/**
 * Board columns.
 *
 * Reading is open to every member — you cannot render the board without them.
 * Changing the shape of the board is an admin action: it is the same board for
 * everyone, so one person renaming "Doing" changes it under the whole team.
 */
@ApiTags('columns')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('columns')
export class ColumnsController {
  constructor(private readonly columns: ColumnsService) {}

  @Get()
  @ApiOperation({ summary: 'Board columns, left to right' })
  findAll(
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<ColumnWithCount[]> {
    return this.columns.findAll(workspace.workspaceId);
  }

  @Post()
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Add a column to the end of the board' })
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: CreateColumnDto,
  ): Promise<ColumnWithCount> {
    return this.columns.create(workspace.workspaceId, dto);
  }

  @Patch('order')
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Rearrange the columns' })
  reorder(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: ReorderColumnsDto,
  ): Promise<ColumnWithCount[]> {
    return this.columns.reorder(workspace.workspaceId, dto);
  }

  @Patch(':id')
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Rename or recolour a column' })
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
  ): Promise<ColumnWithCount> {
    return this.columns.update(workspace.workspaceId, id, dto);
  }

  @Delete(':id')
  @RequireRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a column, moving any tasks it holds to another',
  })
  remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
    @Query() dto: DeleteColumnDto,
  ): Promise<void> {
    return this.columns.remove(workspace.workspaceId, id, dto);
  }
}
