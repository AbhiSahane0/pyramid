/**
 * API types mirroring the NestJS/Prisma backend (dates arrive as ISO strings).
 */

export type TaskStatus = "BACKLOG" | "TODO" | "DOING" | "COMPLETED" | "ON_HOLD";

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
  status: TaskStatus;
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
  reporter: Member | null;
  parent: { id: string; title: string } | null;
  subtasks: Task[];
  comments: Comment[];
  activities: Activity[];
  resources: Resource[];
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  memberId?: string;
  labelId?: string;
  reporterId?: string;
}

// --- Display metadata shared across the UI ---

export const STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "DOING",
  "COMPLETED",
  "ON_HOLD",
];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; dotClass: string }
> = {
  BACKLOG: { label: "Backlog", dotClass: "bg-amber-500" },
  TODO: { label: "To Do", dotClass: "bg-slate-400" },
  DOING: { label: "Doing", dotClass: "bg-blue-500" },
  COMPLETED: { label: "Completed", dotClass: "bg-emerald-500" },
  ON_HOLD: { label: "On Hold", dotClass: "bg-orange-400" },
};

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
