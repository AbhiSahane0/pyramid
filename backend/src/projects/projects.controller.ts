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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectWithLead } from './projects.service';

@ApiTags('projects')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List the workspace projects' })
  findAll(@CurrentUser() user: User): Promise<ProjectWithLead[]> {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one project' })
  findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ProjectWithLead> {
    return this.projectsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectWithLead> {
    return this.projectsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectWithLead> {
    return this.projectsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and its tasks' })
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.projectsService.remove(user.id, id);
  }
}
