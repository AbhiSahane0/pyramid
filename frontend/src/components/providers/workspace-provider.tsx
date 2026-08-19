"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { WorkspaceContext } from "@/components/providers/workspace-context";
import { useMe } from "@/hooks/use-api";
import { api, setActiveWorkspaceId } from "@/lib/api";
import type { Workspace } from "@/lib/types";

const STORAGE_KEY = "pyramid-active-workspace";

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
/**
 * Which workspace to open when there's nothing to remember — a first sign-in,
 * a new device, or a stored id that no longer resolves.
 *
 * Every account is provisioned with a personal workspace, so for anyone who
 * was invited into a team, the oldest workspace is their own empty one. Taking
 * it literally means signing in and being shown a blank board while the work
 * you were invited to sits one menu away. A workspace shared with other people
 * is the one they came here for, so prefer it.
 */
function pickDefault(workspaces: Workspace[]): Workspace {
  return workspaces.find((w) => w.memberCount > 1) ?? workspaces[0];
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
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
    return workspaces.find((w) => w.id === requestedId) ?? pickDefault(workspaces);
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

  // No cache eviction needed: every workspace-scoped query is keyed by the
  // workspace id, so the new one simply reads a different entry and switching
  // back is instant instead of a refetch.
  const switchWorkspace = useCallback((id: string) => {
    setRequestedId(id);
    setActiveWorkspaceId(id);
  }, []);

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

export { useWorkspace } from "@/components/providers/workspace-context";
