import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspace } from '../workspaces/current-workspace.decorator';
import type { WorkspaceContext } from '../workspaces/workspace-context';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { AssistantService, type AskResult } from './assistant.service';
import { AskDto } from './dto/ask.dto';

@ApiTags('assistant')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether question answering is available' })
  status(): { configured: boolean } {
    return { configured: this.assistant.configured };
  }

  @Post('ask')
  // Each question costs a paid API call and can fan out into several, so this
  // is tighter than the app-wide limit: enough to hold a conversation, not
  // enough for a loop to run up a bill.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ask a question about this workspace' })
  ask(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() dto: AskDto,
  ): Promise<AskResult> {
    return this.assistant.ask(workspace.workspaceId, dto.question);
  }
}
