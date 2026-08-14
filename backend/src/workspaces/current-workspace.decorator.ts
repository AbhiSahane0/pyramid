import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { WorkspaceContext } from './workspace-context';

/** Injects the workspace + role resolved by WorkspaceGuard. */
export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceContext => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ workspace: WorkspaceContext }>();
    return request.workspace;
  },
);
