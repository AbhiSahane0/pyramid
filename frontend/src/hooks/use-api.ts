"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-context";
import {
  api,
  type CreateTaskInput,
  type ProjectInput,
  type UpdateTaskInput,
} from "@/lib/api";
import type { Task, TaskFilters, TaskStatus, WorkspaceRole } from "@/lib/types";

export const queryKeys = {
  me: ["me"] as const,
  tasks: (filters: TaskFilters = {}) => ["tasks", filters] as const,
  task: (id: string) => ["task", id] as const,
  projects: ["projects"] as const,
  members: ["members"] as const,
  avatarOptions: ["avatar-options"] as const,
  labels: ["labels"] as const,
  workspaces: ["workspaces"] as const,
  workspaceMembers: ["workspace-members"] as const,
  workspaceInvitations: ["workspace-invitations"] as const,
};

/**
 * Anything the API answers per workspace is cached per workspace and fetched
 * only once one is known.
 *
 * Both halves matter. The gate stops the first paint from asking before the
 * workspace list has arrived — that request carried no scope, and the server
 * used to answer it with a guess, which is how an invited member saw an empty
 * board until something forced a refetch. The key keeps two workspaces from
 * sharing a cache entry, so switching can never show the previous one's cards.
 */
function useWorkspaceQuery<T>(
  key: readonly unknown[],
  queryFn: () => Promise<T>,
  options: { staleTime?: number; enabled?: boolean } = {},
) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;
  return useQuery({
    queryKey: [...key, workspaceId] as const,
    queryFn,
    staleTime: options.staleTime,
    enabled: Boolean(workspaceId) && options.enabled !== false,
  });
}

// --- Auth / users ---

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: api.auth.me,
    staleTime: 60_000,
    // A 401 here is a definitive answer — "not signed in" — not a transient
    // failure. Retrying it only burns round-trips and leaves pages that render
    // a signed-out state (the invite page) stuck on a skeleton meanwhile.
    retry: false,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });
}

export function useMembers() {
  return useWorkspaceQuery(queryKeys.members, api.users.members, {
    staleTime: 300_000,
  });
}

export function useAvatarOptions(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.avatarOptions,
    queryFn: api.users.avatarOptions,
    // Derived from the account, so it never changes within a session.
    staleTime: Infinity,
    enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.updateMe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      // The user's own face appears on every card they're assigned to.
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useLeaveWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.leaveWorkspace,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Labels ---

export function useLabels() {
  return useWorkspaceQuery(queryKeys.labels, api.labels.list, {
    staleTime: 300_000,
  });
}

// --- Tasks ---

export function useTasks(filters: TaskFilters = {}) {
  return useWorkspaceQuery(queryKeys.tasks(filters), () => api.tasks.list(filters));
}

export function useTask(id: string) {
  return useWorkspaceQuery(queryKeys.task(id), () => api.tasks.get(id));
}

function invalidateTasks(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  if (taskId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.tasks.create(input),
    onSuccess: (task) => {
      invalidateTasks(queryClient, task.parentId ?? undefined);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.tasks.update(id, input),
    onSuccess: (task) => {
      invalidateTasks(queryClient, task.id);
      invalidateTasks(queryClient, task.parentId ?? undefined);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => {
      invalidateTasks(queryClient);
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(error.message),
  });
}

/**
 * Kanban drag & drop with an optimistic update: the card lands instantly in
 * every cached task list; the server result reconciles on settle.
 */
export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      position,
    }: {
      id: string;
      status: TaskStatus;
      position: number;
    }) => api.tasks.move(id, { status, position }),
    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (tasks) =>
        tasks
          ?.map((task) => (task.id === id ? { ...task, status, position } : task))
          .sort((a, b) => a.position - b.position),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message);
    },
    onSettled: () => invalidateTasks(queryClient),
  });
}

// --- Comments & resources ---

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      api.tasks.addComment(taskId, input),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) }),
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.tasks.deleteComment(commentId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) }),
    onError: (error) => toast.error(error.message),
  });
}

export function useAddResource(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; url: string }) =>
      api.tasks.addResource(taskId, input),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) }),
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteResource(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => api.tasks.deleteResource(resourceId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) }),
    onError: (error) => toast.error(error.message),
  });
}

// --- Projects ---

export function useProjects() {
  return useWorkspaceQuery(queryKeys.projects, api.projects.list);
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput & { name: string }) => api.projects.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) =>
      api.projects.update(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Project deleted");
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Workspaces ---

export function useWorkspaceMembers() {
  return useWorkspaceQuery(queryKeys.workspaceMembers, api.workspaces.members);
}

export function useWorkspaceInvitations(enabled: boolean) {
  return useWorkspaceQuery(
    queryKeys.workspaceInvitations,
    api.workspaces.invitations,
    // Only admins may list invitations; asking as a member would 403.
    { enabled },
  );
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workspaces.create,
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success(`Created "${workspace.name}"`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRenameWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workspaces.rename,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success("Workspace renamed");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workspaces.invite,
    onSuccess: (invitation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceInvitations,
      });
      if (invitation.emailed) {
        toast.success(`Invitation sent to ${invitation.email}`);
      } else {
        // The invite is valid either way; only delivery failed.
        toast.warning("Invitation created, but the email didn't send", {
          description: "Copy the link from the dialog to share it.",
        });
      }
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workspaces.revokeInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceInvitations,
      });
      toast.success("Invitation revoked");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
      api.workspaces.updateMemberRole(userId, role),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers });
      toast.success(`${member.name} is now ${member.role.toLowerCase()}`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workspaces.removeMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success("Member removed");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useLeaveWorkspaceTeam() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: api.workspaces.leave,
    onSuccess: () => {
      queryClient.clear();
      router.push("/tasks");
      router.refresh();
      toast.success("You left the workspace");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.invitations.accept,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}
