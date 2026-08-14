"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMe } from "@/hooks/use-api";
import { api, setActiveWorkspaceId } from "@/lib/api";
import type { Workspace } from "@/lib/types";

const STORAGE_KEY = "pyramid-active-workspace";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  /** True until the workspace list has loaded — gate data fetching on this. */
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  isLoading: true,
  switchWorkspace: () => undefined,
});

function readStoredId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Owns which workspace the app is looking at.
 *
 * The choice is persisted, but always validated against the workspaces the
 * server says you belong to — otherwise being removed from a workspace would
 * leave the client pinned to one it can no longer read, and every request would
 * 404. When the stored id is stale we silently fall back to the first one.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [requestedId, setRequestedId] = useState<string | null>(readStoredId);

  // Gated on the session: asking while signed out 401s, and that failure would
  // sit in the cache after login, leaving the app thinking it has no workspace.
  const { data: me } = useMe();
  const { data: workspaces = [], isPending } = useQuery({
    queryKey: ["workspaces"],
    queryFn: api.workspaces.list,
    staleTime: 60_000,
    enabled: Boolean(me),
  });

  const activeWorkspace = useMemo(() => {
    if (workspaces.length === 0) return null;
    return workspaces.find((w) => w.id === requestedId) ?? workspaces[0];
  }, [workspaces, requestedId]);

  // Publish to the API client before children render their queries, so the
  // very first request already carries the right workspace.
  const activeId = activeWorkspace?.id ?? null;
  setActiveWorkspaceId(activeId);

  useEffect(() => {
    if (!activeId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, activeId);
    } catch {
      // Private mode: the choice just won't survive a reload.
    }
  }, [activeId]);

  const switchWorkspace = useCallback(
    (id: string) => {
      setRequestedId(id);
      setActiveWorkspaceId(id);
      // Everything on screen belongs to the previous workspace.
      queryClient.removeQueries({ queryKey: ["tasks"] });
      queryClient.removeQueries({ queryKey: ["task"] });
      queryClient.removeQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["members"] });
      queryClient.removeQueries({ queryKey: ["workspace-members"] });
      queryClient.removeQueries({ queryKey: ["workspace-invitations"] });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      isLoading: Boolean(me) && isPending,
      switchWorkspace,
    }),
    [workspaces, activeWorkspace, me, isPending, switchWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
