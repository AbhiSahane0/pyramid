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
import { WorkspaceRole, type Task, type User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../workspaces/current-workspace.decorator';
import {
  hasAtLeast,
  type WorkspaceContext,
} from '../workspaces/workspace-context';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import type { TaskDetail, TaskListItem } from './tasks.service';

@ApiTags('tasks')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List top-level tasks with optional filters' })
  findAll(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query() query: TaskQueryDto,
  ): Promise<TaskListItem[]> {
    return this.tasksService.findAll(workspace.workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Full task detail: subtasks, comments, activity, resources',
  })
  findOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
  ): Promise<TaskDetail> {
    return this.tasksService.findOne(workspace.workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task (or subtask via parentId)' })
  create(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDetail> {
    return this.tasksService.create(workspace.workspaceId, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task fields, members, labels' })
  update(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDetail> {
    return this.tasksService.update(workspace.workspaceId, user.id, id, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a task between/within board columns' })
  move(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ): Promise<Task> {
    return this.tasksService.move(workspace.workspaceId, user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task and its subtasks' })
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tasksService.remove(workspace.workspaceId, id);
  }

  // --- Comments ---

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a task (or reply via parentId)' })
  addComment(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(
      workspace.workspaceId,
      user.id,
      taskId,
      dto,
    );
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    await this.tasksService.deleteComment(
      workspace.workspaceId,
      user.id,
      commentId,
      hasAtLeast(workspace.role, WorkspaceRole.ADMIN),
    );
  }

  // --- Resources ---

  @Post(':id/resources')
  @ApiOperation({ summary: 'Attach a document/link to a task' })
  addResource(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') taskId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.tasksService.addResource(workspace.workspaceId, taskId, dto);
  }

  @Delete('resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an attached resource' })
  async removeResource(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('resourceId') resourceId: string,
  ): Promise<void> {
    await this.tasksService.removeResource(workspace.workspaceId, resourceId);
  }
}
