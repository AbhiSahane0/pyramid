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
import type { Task, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List top-level tasks with optional filters' })
  findAll(
    @CurrentUser() user: User,
    @Query() query: TaskQueryDto,
  ): Promise<TaskListItem[]> {
    return this.tasksService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Full task detail: subtasks, comments, activity, resources',
  })
  findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<TaskDetail> {
    return this.tasksService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task (or subtask via parentId)' })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDetail> {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task fields, members, labels' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDetail> {
    return this.tasksService.update(user.id, id, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a task between/within board columns' })
  move(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ): Promise<Task> {
    return this.tasksService.move(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task and its subtasks' })
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tasksService.remove(user.id, id);
  }

  // --- Comments ---

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a task (or reply via parentId)' })
  addComment(
    @CurrentUser() user: User,
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(user.id, taskId, dto);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @CurrentUser() user: User,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    await this.tasksService.deleteComment(user.id, commentId);
  }

  // --- Resources ---

  @Post(':id/resources')
  @ApiOperation({ summary: 'Attach a document/link to a task' })
  addResource(
    @CurrentUser() user: User,
    @Param('id') taskId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.tasksService.addResource(user.id, taskId, dto);
  }

  @Delete('resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an attached resource' })
  async removeResource(
    @CurrentUser() user: User,
    @Param('resourceId') resourceId: string,
  ): Promise<void> {
    await this.tasksService.removeResource(user.id, resourceId);
  }
}
