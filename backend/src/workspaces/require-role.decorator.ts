import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

export const REQUIRED_ROLE = 'workspace:required-role';

/**
 * Minimum role needed for a route, enforced by WorkspaceGuard.
 * `@RequireRole(WorkspaceRole.ADMIN)` also admits OWNER.
 */
export const RequireRole = (role: WorkspaceRole) =>
  SetMetadata(REQUIRED_ROLE, role);
