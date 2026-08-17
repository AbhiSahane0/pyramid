import type {
  CreatedInvitation,
  Invitation,
  InvitationPreview,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Comment,
  Label,
  Priority,
  Project,
  Resource,
  Task,
  TaskDetail,
  TaskFilters,
  BoardColumn,
  BoardColor,
  User,
} from "./types";

/** Error thrown for non-2xx API responses, carrying the backend's error shape. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Internal: set when retrying after a token refresh. */
  _retried?: boolean;
}

/**
 * Single-flight token refresh: concurrent 401s share one /auth/refresh call.
 * Without this, parallel queries would race — the first rotation succeeds and
 * the second presents the stale token, tripping the server's reuse detection.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Which workspace the API should act on. Held at module scope rather than in
 * React state so every request picks it up without threading it through call
 * sites; the WorkspaceProvider is the only writer.
 */
let activeWorkspaceId: string | null = null;

export function setActiveWorkspaceId(id: string | null): void {
  activeWorkspaceId = id;
}

export function getActiveWorkspaceId(): string | null {
  return activeWorkspaceId;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  // Workspace-scoped queries wait for this to be set (see useWorkspaceQuery),
  // so in practice it is always present. The server only infers a workspace
  // for callers who belong to exactly one, and 400s otherwise rather than
  // guessing.
  if (activeWorkspaceId) headers["x-workspace-id"] = activeWorkspaceId;

  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  // Access token expired: refresh once (shared across callers), then retry.
  if (response.status === 401 && !options._retried && path !== "/auth/refresh") {
    if (await refreshSession()) {
      return request<T>(path, { ...options, _retried: true });
    }
    // Session fully expired. Clear the dead cookies first — otherwise the
    // route-protection proxy still sees a refresh cookie and would bounce
    // /login straight back here in a redirect loop.
    // The invite page renders its own signed-out state, so bouncing away from
    // it would lose the link the user just clicked.
    const currentPath = typeof window === "undefined" ? "" : window.location.pathname;
    if (
      typeof window !== "undefined" &&
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/invite")
    ) {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(
        () => undefined,
      );
      window.location.assign(new URL("/login", window.location.origin).toString());
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message.join(", ");
      else if (data.message) message = data.message;
    } catch {
      // Non-JSON error body — keep the fallback message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter((pair): pair is [string, string] =>
    Boolean(pair[1]),
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId?: string;
  priority?: Priority;
  startDate?: string;
  dueDate?: string;
  projectId?: string;
  parentId?: string;
  memberIds?: string[];
  labelIds?: string[];
  reporterId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  columnId?: string;
  priority?: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  memberIds?: string[];
  labelIds?: string[];
  reporterId?: string | null;
}

export interface ProjectInput {
  name?: string;
  priority?: Priority;
  dueDate?: string;
  leadId?: string;
}

/** Typed API client — the only place the app talks to the network. */
export const api = {
  auth: {
    me: () => request<User>("/auth/me"),
    guestLogin: () => request<User>("/auth/guest", { method: "POST" }),
    logout: () => request<{ success: boolean }>("/auth/logout", { method: "POST" }),
    /** Google OAuth is a full-page redirect, not an XHR. */
    googleLoginUrl: "/api/auth/google",
  },
  users: {
    members: () => request<User[]>("/users/members"),
    avatarOptions: () => request<{ options: string[] }>("/users/me/avatars"),
    updateMe: (input: {
      name?: string;
      title?: string;
      username?: string;
      avatarUrl?: string;
    }) => request<User>("/users/me", { method: "PATCH", body: input }),
    leaveWorkspace: () =>
      request<{ success: boolean }>("/users/me", { method: "DELETE" }),
  },
  tasks: {
    list: (filters: TaskFilters = {}) =>
      request<Task[]>(`/tasks${query({ ...filters })}`),
    get: (id: string) => request<TaskDetail>(`/tasks/${id}`),
    create: (input: CreateTaskInput) =>
      request<TaskDetail>("/tasks", { method: "POST", body: input }),
    update: (id: string, input: UpdateTaskInput) =>
      request<TaskDetail>(`/tasks/${id}`, { method: "PATCH", body: input }),
    move: (id: string, input: { columnId: string; position: number }) =>
      request<Task>(`/tasks/${id}/move`, { method: "PATCH", body: input }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
    addComment: (taskId: string, input: { body: string; parentId?: string }) =>
      request<Comment>(`/tasks/${taskId}/comments`, { method: "POST", body: input }),
    deleteComment: (commentId: string) =>
      request<void>(`/tasks/comments/${commentId}`, { method: "DELETE" }),
    addResource: (taskId: string, input: { name: string; url: string }) =>
      request<Resource>(`/tasks/${taskId}/resources`, { method: "POST", body: input }),
    deleteResource: (resourceId: string) =>
      request<void>(`/tasks/resources/${resourceId}`, { method: "DELETE" }),
  },
  projects: {
    list: () => request<Project[]>("/projects"),
    get: (id: string) => request<Project>(`/projects/${id}`),
    create: (input: ProjectInput & { name: string }) =>
      request<Project>("/projects", { method: "POST", body: input }),
    update: (id: string, input: ProjectInput) =>
      request<Project>(`/projects/${id}`, { method: "PATCH", body: input }),
    delete: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),
  },
  labels: {
    list: () => request<Label[]>("/labels"),
  },
  assistant: {
    status: () => request<{ configured: boolean }>("/assistant/status"),
    ask: (question: string) =>
      request<{ answer: string; usedTools: string[] }>("/assistant/ask", {
        method: "POST",
        body: { question },
      }),
  },
  columns: {
    list: () => request<BoardColumn[]>("/columns"),
    create: (input: { name: string; color?: BoardColor; isDone?: boolean }) =>
      request<BoardColumn>("/columns", { method: "POST", body: input }),
    update: (
      id: string,
      input: { name?: string; color?: BoardColor; isDone?: boolean },
    ) => request<BoardColumn>(`/columns/${id}`, { method: "PATCH", body: input }),
    reorder: (columnIds: string[]) =>
      request<BoardColumn[]>("/columns/order", {
        method: "PATCH",
        body: { columnIds },
      }),
    remove: (id: string, moveTasksTo?: string) =>
      request<void>(`/columns/${id}${query({ moveTasksTo })}`, {
        method: "DELETE",
      }),
  },
  workspaces: {
    list: () => request<Workspace[]>("/workspaces"),
    create: (input: { name: string }) =>
      request<Workspace>("/workspaces", { method: "POST", body: input }),
    rename: (input: { name: string }) =>
      request<Workspace>("/workspaces/current", { method: "PATCH", body: input }),
    remove: () => request<void>("/workspaces/current", { method: "DELETE" }),
    leave: () =>
      request<{ success: boolean }>("/workspaces/current/leave", { method: "POST" }),

    members: () => request<WorkspaceMember[]>("/workspaces/current/members"),
    updateMemberRole: (userId: string, role: WorkspaceRole) =>
      request<WorkspaceMember>(`/workspaces/current/members/${userId}`, {
        method: "PATCH",
        body: { role },
      }),
    removeMember: (userId: string) =>
      request<void>(`/workspaces/current/members/${userId}`, { method: "DELETE" }),

    invitations: () => request<Invitation[]>("/workspaces/current/invitations"),
    invite: (input: { email: string; role: WorkspaceRole }) =>
      request<CreatedInvitation>("/workspaces/current/invitations", {
        method: "POST",
        body: input,
      }),
    revokeInvitation: (invitationId: string) =>
      request<void>(`/workspaces/current/invitations/${invitationId}`, {
        method: "DELETE",
      }),
  },
  invitations: {
    /** Public: describes an invite without consuming it. */
    preview: (token: string) => request<InvitationPreview>(`/invitations/${token}`),
    accept: (token: string) =>
      request<{ workspaceId: string }>(`/invitations/${token}/accept`, {
        method: "POST",
      }),
  },
};
