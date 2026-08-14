import { WorkspaceRole } from '@prisma/client';

/** Header the frontend sends to say which workspace a request targets. */
export const WORKSPACE_HEADER = 'x-workspace-id';

/**
 * Resolved membership attached to the request by WorkspaceGuard. Carrying the
 * role here means handlers never re-query it to make a permission decision.
 */
export interface WorkspaceContext {
  workspaceId: string;
  role: WorkspaceRole;
}

/** Ranking used for "at least this role" checks. */
const RANK: Record<WorkspaceRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export function hasAtLeast(
  role: WorkspaceRole,
  required: WorkspaceRole,
): boolean {
  return RANK[role] >= RANK[required];
}
