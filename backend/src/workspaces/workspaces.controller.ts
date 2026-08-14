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
import { WorkspaceRole, type User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentWorkspace } from './current-workspace.decorator';
import {
  CreateInvitationDto,
  CreateWorkspaceDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
} from './dto/workspace.dto';
import { InvitationsService } from './invitations.service';
import { RequireRole } from './require-role.decorator';
import type { WorkspaceContext } from './workspace-context';
import { WorkspaceGuard } from './workspace.guard';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly invitations: InvitationsService,
  ) {}

  // --- Workspaces the caller belongs to (no workspace context needed) ---

  @Get()
  @ApiOperation({ summary: 'Workspaces the current user belongs to' })
  findMine(@CurrentUser() user: User) {
    return this.workspaces.findMine(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workspace (creator becomes OWNER)' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(user.id, dto.name);
  }

  // --- Operations on the active workspace (x-workspace-id header) ---

  @Patch('current')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Rename the active workspace' })
  rename(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaces.rename(
      workspace.workspaceId,
      dto.name,
      workspace.role,
    );
  }

  @Delete('current')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the workspace and everything in it' })
  async remove(@CurrentWorkspace() workspace: WorkspaceContext): Promise<void> {
    await this.workspaces.remove(workspace.workspaceId);
  }

  @Post('current/leave')
  @UseGuards(WorkspaceGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave the workspace (owners cannot)' })
  async leave(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<{ success: true }> {
    await this.workspaces.leave(workspace.workspaceId, user.id);
    return { success: true };
  }

  // --- Members ---

  @Get('current/members')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Members of the active workspace' })
  members(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.workspaces.findMembers(workspace.workspaceId);
  }

  @Patch('current/members/:userId')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: "Change a member's role" })
  updateMemberRole(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaces.updateMemberRole(
      workspace.workspaceId,
      user.id,
      userId,
      dto.role,
    );
  }

  @Delete('current/members/:userId')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  async removeMember(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.workspaces.removeMember(workspace.workspaceId, user.id, userId);
  }

  // --- Invitations ---

  @Get('current/invitations')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Pending invitations' })
  pendingInvitations(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.invitations.findPending(workspace.workspaceId);
  }

  @Post('current/invitations')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite someone by email (magic link)' })
  invite(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(
      workspace.workspaceId,
      user,
      dto.email,
      dto.role,
    );
  }

  @Delete('current/invitations/:invitationId')
  @UseGuards(WorkspaceGuard)
  @RequireRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  async revokeInvitation(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('invitationId') invitationId: string,
  ): Promise<void> {
    await this.invitations.revoke(workspace.workspaceId, invitationId);
  }
}

/**
 * Invitation redemption. Separate controller because these routes are keyed by
 * the token rather than by an active workspace — the invitee is not a member
 * yet, so WorkspaceGuard could never pass.
 */
@ApiTags('invitations')
@ApiCookieAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Describe an invitation without consuming it' })
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join the workspace this invitation points at' })
  accept(@Param('token') token: string, @CurrentUser() user: User) {
    return this.invitations.accept(token, user);
  }
}
