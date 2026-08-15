import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { avatarOptions } from '../common/avatar';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../workspaces/current-workspace.decorator';
import type { WorkspaceContext } from '../workspaces/workspace-context';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toPublicUser } from './user.mapper';
import type { PublicUser } from './user.mapper';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get('members')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Workspace members assignable to tasks' })
  async members(
    @CurrentWorkspace() workspace: WorkspaceContext,
  ): Promise<PublicUser[]> {
    const users = await this.usersService.findAssignableMembers(
      workspace.workspaceId,
    );
    return users.map(toPublicUser);
  }

  @Get('me/avatars')
  @ApiOperation({ summary: 'Generated profile pictures to choose from' })
  avatars(@CurrentUser() user: User): { options: string[] } {
    return { options: avatarOptions(user.username ?? user.email) };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return toPublicUser(updated);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Leave workspace — delete account and all owned data',
  })
  async deleteMe(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    await this.usersService.deleteAccount(user.id);
    this.authService.clearAuthCookies(res);
    return { success: true };
  }
}
