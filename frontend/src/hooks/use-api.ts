"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  api,
  type CreateTaskInput,
  type ProjectInput,
  type UpdateTaskInput,
} from "@/lib/api";
import type { Task, TaskFilters, TaskStatus } from "@/lib/types";

export const queryKeys = {
  me: ["me"] as const,
  tasks: (filters: TaskFilters = {}) => ["tasks", filters] as const,
  task: (id: string) => ["task", id] as const,
  projects: ["projects"] as const,
  members: ["members"] as const,
  labels: ["labels"] as const,
};

// --- Auth / users ---

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.auth.me, staleTime: 60_000 });
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
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: api.users.members,
    staleTime: 300_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.updateMe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
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
  return useQuery({
    queryKey: queryKeys.labels,
    queryFn: api.labels.list,
    staleTime: 300_000,
  });
}

// --- Tasks ---

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: () => api.tasks.list(filters),
  });
}

export function useTask(id: string) {
  return useQuery({ queryKey: queryKeys.task(id), queryFn: () => api.tasks.get(id) });
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
      queryClient.setQueryData(queryKeys.task(task.id), task);
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
  return useQuery({ queryKey: queryKeys.projects, queryFn: api.projects.list });
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
