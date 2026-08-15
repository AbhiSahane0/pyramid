import {
  ArrowRightLeft,
  FolderPlus,
  ListPlus,
  Pencil,
  ShieldCheck,
  SignalHigh,
  Trash2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  type Priority,
  type TaskStatus,
  type WorkspaceRole,
} from "@/lib/types";

/**
 * How a single argument is collected.
 *
 * `choice` renders fixed options; `member` and `task` resolve their options
 * from the live workspace, so the user picks real records instead of typing an
 * id they cannot know.
 */
export type ArgKind = "text" | "email" | "choice" | "member" | "task" | "confirm";

export interface ArgOption {
  value: string;
  label: string;
  description?: string;
}

export interface CommandArg {
  key: string;
  /** Short name shown on the collected-value chip. */
  label: string;
  /** The question put to the user — plain, specific, no jargon. */
  prompt: string;
  placeholder: string;
  kind: ArgKind;
  options?: ArgOption[];
  /** Offered with a "Skip" affordance and a stated default. */
  optional?: boolean;
  skipLabel?: string;
  validate?: (value: string) => string | null;
}

export interface AssistantCommand {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  group: "Tasks" | "People" | "Projects";
  keywords: string[];
  /** Hidden from members: showing an action that can only 403 is a dead end. */
  adminOnly?: boolean;
  destructive?: boolean;
  args: CommandArg[];
  /** One line describing exactly what will happen, shown before running. */
  review: (values: Record<string, string>, labels: Record<string, string>) => string;
  run: (values: Record<string, string>, deps: CommandRunners) => Promise<string>;
}

/** The mutations a command may perform, injected by the widget. */
export interface CommandRunners {
  createTask: (input: {
    title: string;
    status?: TaskStatus;
    priority?: Priority;
    memberIds?: string[];
  }) => Promise<{ id: string; title: string }>;
  updateTask: (
    id: string,
    input: {
      title?: string;
      status?: TaskStatus;
      priority?: Priority;
      memberIds?: string[];
    },
  ) => Promise<{ title: string }>;
  deleteTask: (id: string) => Promise<void>;
  createProject: (input: { name: string; priority?: Priority }) => Promise<{
    name: string;
  }>;
  inviteMember: (input: { email: string; role: WorkspaceRole }) => Promise<{
    email: string;
    emailed: boolean;
  }>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: WorkspaceRole) => Promise<{ name: string }>;
}

const statusOptions: ArgOption[] = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

const priorityOptions: ArgOption[] = PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: PRIORITY_META[priority].label,
}));

const roleOptions: ArgOption[] = [
  { value: "MEMBER", label: "Member", description: "Can use the board" },
  { value: "ADMIN", label: "Admin", description: "Can also manage people" },
];

const confirmArg = (prompt: string): CommandArg => ({
  key: "confirm",
  label: "Confirm",
  prompt,
  placeholder: "Choose yes or no",
  kind: "confirm",
  options: [
    { value: "yes", label: "Yes, do it" },
    { value: "no", label: "Cancel" },
  ],
});

const requiredText = (value: string): string | null =>
  value.trim().length === 0 ? "This can't be empty." : null;

const validEmail = (value: string): string | null =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : "That doesn't look like an email address.";

export const ASSISTANT_COMMANDS: AssistantCommand[] = [
  // --- Tasks ---
  {
    id: "create-task",
    label: "Create task",
    hint: "Add a task to the board",
    icon: ListPlus,
    group: "Tasks",
    keywords: ["new", "add", "todo"],
    args: [
      {
        key: "title",
        label: "Title",
        prompt: "What should the task be called?",
        placeholder: "e.g. Fix the login redirect",
        kind: "text",
        validate: requiredText,
      },
      {
        key: "status",
        label: "Column",
        prompt: "Which column should it start in?",
        placeholder: "Pick a column",
        kind: "choice",
        options: statusOptions,
        optional: true,
        skipLabel: "Use To Do",
      },
      {
        key: "priority",
        label: "Priority",
        prompt: "How urgent is it?",
        placeholder: "Pick a priority",
        kind: "choice",
        options: priorityOptions,
        optional: true,
        skipLabel: "No priority",
      },
      {
        key: "assignee",
        label: "Assignee",
        prompt: "Who should own it?",
        placeholder: "Pick a person",
        kind: "member",
        optional: true,
        skipLabel: "Leave unassigned",
      },
    ],
    review: (v, l) =>
      `Create “${v.title}” in ${l.status ?? "To Do"}${
        v.priority ? `, priority ${l.priority}` : ""
      }${v.assignee ? `, assigned to ${l.assignee}` : ""}.`,
    run: async (v, deps) => {
      const task = await deps.createTask({
        title: v.title,
        status: (v.status as TaskStatus) || undefined,
        priority: (v.priority as Priority) || undefined,
        memberIds: v.assignee ? [v.assignee] : undefined,
      });
      return `Created “${task.title}”.`;
    },
  },
  {
    id: "assign-task",
    label: "Assign task",
    hint: "Give a task an owner",
    icon: UserPlus,
    group: "Tasks",
    keywords: ["owner", "give", "delegate"],
    args: [
      {
        key: "task",
        label: "Task",
        prompt: "Which task?",
        placeholder: "Search your tasks",
        kind: "task",
      },
      {
        key: "assignee",
        label: "Assignee",
        prompt: "Who should own it?",
        placeholder: "Pick a person",
        kind: "member",
      },
    ],
    review: (_v, l) => `Assign “${l.task}” to ${l.assignee}.`,
    run: async (v, deps) => {
      const task = await deps.updateTask(v.task, { memberIds: [v.assignee] });
      return `“${task.title}” is now assigned.`;
    },
  },
  {
    id: "move-task",
    label: "Move task",
    hint: "Change which column a task sits in",
    icon: ArrowRightLeft,
    group: "Tasks",
    keywords: ["status", "column", "progress", "done"],
    args: [
      {
        key: "task",
        label: "Task",
        prompt: "Which task?",
        placeholder: "Search your tasks",
        kind: "task",
      },
      {
        key: "status",
        label: "Column",
        prompt: "Move it to which column?",
        placeholder: "Pick a column",
        kind: "choice",
        options: statusOptions,
      },
    ],
    review: (_v, l) => `Move “${l.task}” to ${l.status}.`,
    run: async (v, deps) => {
      const task = await deps.updateTask(v.task, { status: v.status as TaskStatus });
      return `Moved “${task.title}”.`;
    },
  },
  {
    id: "set-priority",
    label: "Set priority",
    hint: "Change how urgent a task is",
    icon: SignalHigh,
    group: "Tasks",
    keywords: ["urgent", "high", "low"],
    args: [
      {
        key: "task",
        label: "Task",
        prompt: "Which task?",
        placeholder: "Search your tasks",
        kind: "task",
      },
      {
        key: "priority",
        label: "Priority",
        prompt: "What priority should it be?",
        placeholder: "Pick a priority",
        kind: "choice",
        options: priorityOptions,
      },
    ],
    review: (_v, l) => `Set “${l.task}” to ${l.priority}.`,
    run: async (v, deps) => {
      const task = await deps.updateTask(v.task, { priority: v.priority as Priority });
      return `Updated “${task.title}”.`;
    },
  },
  {
    id: "rename-task",
    label: "Rename task",
    hint: "Give a task a new title",
    icon: Pencil,
    group: "Tasks",
    keywords: ["title", "edit", "update"],
    args: [
      {
        key: "task",
        label: "Task",
        prompt: "Which task?",
        placeholder: "Search your tasks",
        kind: "task",
      },
      {
        key: "title",
        label: "New title",
        prompt: "What should it be called instead?",
        placeholder: "New title",
        kind: "text",
        validate: requiredText,
      },
    ],
    review: (v, l) => `Rename “${l.task}” to “${v.title}”.`,
    run: async (v, deps) => {
      const task = await deps.updateTask(v.task, { title: v.title });
      return `Renamed to “${task.title}”.`;
    },
  },
  {
    id: "delete-task",
    label: "Delete task",
    hint: "Remove a task for good",
    icon: Trash2,
    group: "Tasks",
    keywords: ["remove", "destroy"],
    destructive: true,
    args: [
      {
        key: "task",
        label: "Task",
        prompt: "Which task should I delete?",
        placeholder: "Search your tasks",
        kind: "task",
      },
      confirmArg("This deletes the task and its subtasks and comments. Go ahead?"),
    ],
    review: (_v, l) => `Delete “${l.task}” permanently.`,
    run: async (v, deps) => {
      await deps.deleteTask(v.task);
      return "Task deleted.";
    },
  },

  // --- People ---
  {
    id: "invite-member",
    label: "Invite member",
    hint: "Email someone an invite to this workspace",
    icon: UserPlus,
    group: "People",
    keywords: ["add", "person", "teammate", "email"],
    adminOnly: true,
    args: [
      {
        key: "email",
        label: "Email",
        prompt: "What's their email address?",
        placeholder: "teammate@example.com",
        kind: "email",
        validate: validEmail,
      },
      {
        key: "role",
        label: "Role",
        prompt: "What should they be able to do?",
        placeholder: "Pick a role",
        kind: "choice",
        options: roleOptions,
        optional: true,
        skipLabel: "Join as Member",
      },
    ],
    review: (v, l) => `Invite ${v.email} as ${l.role ?? "Member"}.`,
    run: async (v, deps) => {
      const invitation = await deps.inviteMember({
        email: v.email,
        role: (v.role as WorkspaceRole) || "MEMBER",
      });
      return invitation.emailed
        ? `Invitation emailed to ${invitation.email}.`
        : `Invitation created for ${invitation.email}. Email delivery failed, so copy the link from Members to share it.`;
    },
  },
  {
    id: "change-role",
    label: "Change role",
    hint: "Promote or demote a member",
    icon: ShieldCheck,
    group: "People",
    keywords: ["admin", "permission", "promote"],
    adminOnly: true,
    args: [
      {
        key: "member",
        label: "Member",
        prompt: "Whose role should change?",
        placeholder: "Pick a person",
        kind: "member",
      },
      {
        key: "role",
        label: "Role",
        prompt: "What should their new role be?",
        placeholder: "Pick a role",
        kind: "choice",
        options: roleOptions,
      },
    ],
    review: (_v, l) => `Make ${l.member} ${l.role}.`,
    run: async (v, deps) => {
      const member = await deps.updateMemberRole(v.member, v.role as WorkspaceRole);
      return `${member.name}'s role updated.`;
    },
  },
  {
    id: "remove-member",
    label: "Remove member",
    hint: "Revoke someone's access",
    icon: UserMinus,
    group: "People",
    keywords: ["kick", "delete", "access"],
    adminOnly: true,
    destructive: true,
    args: [
      {
        key: "member",
        label: "Member",
        prompt: "Who should lose access?",
        placeholder: "Pick a person",
        kind: "member",
      },
      confirmArg("They lose access immediately. Anything they created stays. Go ahead?"),
    ],
    review: (_v, l) => `Remove ${l.member} from this workspace.`,
    run: async (v, deps) => {
      await deps.removeMember(v.member);
      return "Member removed.";
    },
  },

  // --- Projects ---
  {
    id: "create-project",
    label: "Create project",
    hint: "Group related tasks under a project",
    icon: FolderPlus,
    group: "Projects",
    keywords: ["new", "add", "group"],
    args: [
      {
        key: "name",
        label: "Name",
        prompt: "What should the project be called?",
        placeholder: "e.g. Website redesign",
        kind: "text",
        validate: requiredText,
      },
      {
        key: "priority",
        label: "Priority",
        prompt: "How urgent is it?",
        placeholder: "Pick a priority",
        kind: "choice",
        options: priorityOptions,
        optional: true,
        skipLabel: "No priority",
      },
    ],
    review: (v, l) =>
      `Create project “${v.name}”${v.priority ? `, priority ${l.priority}` : ""}.`,
    run: async (v, deps) => {
      const project = await deps.createProject({
        name: v.name,
        priority: (v.priority as Priority) || undefined,
      });
      return `Created project “${project.name}”.`;
    },
  },
];

/** Commands the current role may actually run. */
export function availableCommands(role: WorkspaceRole | undefined): AssistantCommand[] {
  const isAdmin = role === "ADMIN" || role === "OWNER";
  return ASSISTANT_COMMANDS.filter((command) => !command.adminOnly || isAdmin);
}

/**
 * Best-effort match for plain English typed without an "@". It makes no
 * attempt to understand the sentence — it looks for the words a command is
 * made of, so "add a new todo" offers Create task. Below the threshold it
 * returns null, because a wrong guess costs more than no guess.
 */
export function suggestCommand(
  commands: AssistantCommand[],
  text: string,
): AssistantCommand | null {
  const words = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
  if (words.size === 0) return null;

  let best: { command: AssistantCommand; score: number } | null = null;
  for (const command of commands) {
    const [verb, ...rest] = command.label.toLowerCase().split(" ");
    const noun = rest[rest.length - 1];
    const score =
      (words.has(verb) ? 2 : 0) +
      (words.has(noun) || words.has(`${noun}s`) ? 1 : 0) +
      command.keywords.filter((keyword) => words.has(keyword)).length;
    if (score > (best?.score ?? 0)) best = { command, score };
  }
  return best && best.score >= 2 ? best.command : null;
}

/** Ranks by label first, then keywords, so the obvious match leads. */
export function filterCommands(
  commands: AssistantCommand[],
  query: string,
): AssistantCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;

  return commands
    .map((command) => {
      const label = command.label.toLowerCase();
      const compact = label.replace(/\s+/g, "");
      let score = -1;
      if (label.startsWith(q) || compact.startsWith(q)) score = 0;
      else if (label.includes(q) || compact.includes(q)) score = 1;
      else if (command.keywords.some((k) => k.startsWith(q))) score = 2;
      else if (command.hint.toLowerCase().includes(q)) score = 3;
      return { command, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.command);
}
