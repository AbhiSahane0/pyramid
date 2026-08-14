import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectInclude = {
  lead: {
    select: { id: true, name: true, avatarUrl: true, title: true },
  },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectWithLead = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string): Promise<ProjectWithLead[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: projectInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<ProjectWithLead> {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
      include: projectInclude,
    });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  create(
    workspaceId: string,
    actorId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectWithLead> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        leadId: dto.leadId,
        workspaceId,
        createdById: actorId,
      },
      include: projectInclude,
    });
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectWithLead> {
    await this.findOne(workspaceId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        priority: dto.priority,
        dueDate: dto.dueDate !== undefined ? new Date(dto.dueDate) : undefined,
        leadId: dto.leadId,
      },
      include: projectInclude,
    });
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.findOne(workspaceId, id);
    await this.prisma.project.delete({ where: { id } });
  }
}
