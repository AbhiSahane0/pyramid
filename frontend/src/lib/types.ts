/**
 * API types mirroring the NestJS/Prisma backend (dates arrive as ISO strings).
 */

/** Palette keys a column may use; the client owns how each one renders. */
export type BoardColor =
  "slate" | "blue" | "emerald" | "amber" | "orange" | "red" | "violet" | "pink" | "teal";

/** A column on the board. Workspaces define their own. */
export interface BoardColumn {
  id: string;
  name: string;
  color: BoardColor;
  position: number;
  /** Work here is finished — what "open" and "overdue" are measured against. */
  isDone: boolean;
  _count: { tasks: number };
}

/** The slice of a column embedded in each task. */
export interface TaskColumn {
  id: string;
  name: string;
  color: BoardColor;
  position: number;
}

export type Priority = "NO_PRIORITY" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface User {
  id: string;
  email: string;
  name: string;
  username: string | null;
  title: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  createdAt: string;
}

/** Reduced user shape embedded in tasks/comments/projects. */
export interface Member {
  id: string;
  name: string;
  avatarUrl: string | null;
  title: string | null;
}

export interface Label {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  priority: Priority;
  dueDate: string | null;
  leadId: string | null;
  lead: Member | null;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  column: TaskColumn;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  position: number;
  projectId: string | null;
  reporterId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  labels: Label[];
  reporter: Member | null;
  project: { id: string; name: string } | null;
  _count: { subtasks: number; comments: number };
}

export interface Comment {
  id: string;
  body: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: Member;
  replies?: Comment[];
}

export interface Activity {
  id: string;
  type: "status_changed" | "priority_changed" | "update_posted" | string;
  meta: Record<string, string> | null;
  actorId: string | null;
  actor: Member | null;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  taskId: string;
  createdAt: string;
}

export interface TaskDetail extends Task {
  parent: { id: string; title: string } | null;
  subtasks: Task[];
  comments: Comment[];
  activities: Activity[];
  resources: Resource[];
}

export interface TaskFilters {
  search?: string;
  columnId?: string;
  priority?: Priority;
  projectId?: string;
  memberId?: string;
  labelId?: string;
  reporterId?: string;
}

// --- Display metadata shared across the UI ---

/**
 * How each palette key renders. Kept here rather than in the database so the
 * board stays readable in both themes and can be restyled without a migration.
 */
export const BOARD_COLOR_META: Record<BoardColor, { label: string; dotClass: string }> = {
  slate: { label: "Slate", dotClass: "bg-slate-400" },
  blue: { label: "Blue", dotClass: "bg-blue-500" },
  emerald: { label: "Emerald", dotClass: "bg-emerald-500" },
  amber: { label: "Amber", dotClass: "bg-amber-500" },
  orange: { label: "Orange", dotClass: "bg-orange-400" },
  red: { label: "Red", dotClass: "bg-red-500" },
  violet: { label: "Violet", dotClass: "bg-violet-500" },
  pink: { label: "Pink", dotClass: "bg-pink-500" },
  teal: { label: "Teal", dotClass: "bg-teal-500" },
};

export const BOARD_COLORS = Object.keys(BOARD_COLOR_META) as BoardColor[];

/** Unknown colours (an older client, a hand-edited row) still get a dot. */
export function columnDotClass(color: string): string {
  return BOARD_COLOR_META[color as BoardColor]?.dotClass ?? "bg-slate-400";
}

export const PRIORITY_ORDER: Priority[] = [
  "NO_PRIORITY",
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export const PRIORITY_META: Record<
  Priority,
  { label: string; textClass: string; bars: number }
> = {
  NO_PRIORITY: { label: "No Priority", textClass: "text-muted-foreground", bars: 0 },
  URGENT: { label: "Urgent", textClass: "text-red-600 dark:text-red-400", bars: 4 },
  HIGH: { label: "High", textClass: "text-red-500 dark:text-red-400", bars: 3 },
  MEDIUM: { label: "Medium", textClass: "text-orange-500 dark:text-orange-400", bars: 2 },
  LOW: { label: "Low", textClass: "text-muted-foreground", bars: 1 },
};

// --- Workspaces ---

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Workspace {
  id: string;
  name: string;
  /** The signed-in user's role in this workspace. */
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMember extends User {
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
  invitedByName: string | null;
}

export interface CreatedInvitation extends Invitation {
  /** Returned once, at creation, so the UI can offer a copyable link. */
  inviteUrl: string;
  /** True when the email provider accepted the message. */
  emailed: boolean;
  /**
   * The provider's own explanation when it refused. Absent when the send
   * succeeded, and also when no provider is configured — so the UI can tell
   * "not set up" apart from "set up, but rejected this recipient".
   */
  deliveryError?: string;
}

export interface InvitationPreview {
  email: string;
  role: WorkspaceRole;
  workspaceName: string;
  invitedByName: string | null;
  expiresAt: string;
}

/** Ranking for "at least this role" checks, mirroring the backend. */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export function hasAtLeast(role: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}
