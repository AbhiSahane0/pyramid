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
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../workspaces/current-workspace.decorator';
import type { WorkspaceContext } from '../workspaces/workspace-context';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectWithLead } from './projects.service';

@ApiTags('projects')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List the workspace projects' })
  findAll(
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<ProjectWithLead[]> {
    return this.projectsService.findAll(workspace.workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one project' })
  findOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
  ): Promise<ProjectWithLead> {
    return this.projectsService.findOne(workspace.workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  create(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectWithLead> {
    return this.projectsService.create(workspace.workspaceId, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectWithLead> {
    return this.projectsService.update(workspace.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and its tasks' })
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('id') id: string,
  ): Promise<void> {
    await this.projectsService.remove(workspace.workspaceId, id);
  }
}
