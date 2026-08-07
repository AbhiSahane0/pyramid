import type {
  Comment,
  Label,
  Priority,
  Project,
  Resource,
  Task,
  TaskDetail,
  TaskFilters,
  TaskStatus,
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers:
      options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  // Access token expired: refresh once, then retry the original request.
  if (response.status === 401 && !options._retried && path !== "/auth/refresh") {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return request<T>(path, { ...options, _retried: true });
    }
    // Session fully expired — leave the SPA for a clean login page load.
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
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
  status?: TaskStatus;
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
  status?: TaskStatus;
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
    updateMe: (input: { name?: string; title?: string; username?: string }) =>
      request<User>("/users/me", { method: "PATCH", body: input }),
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
    move: (id: string, input: { status: TaskStatus; position: number }) =>
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
};
