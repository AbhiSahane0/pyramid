"use client";

import { createContext, useContext } from "react";
import type { Workspace } from "@/lib/types";

export interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  /** True until the workspace list has loaded — gate data fetching on this. */
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
}

/**
 * Split from the provider so the data hooks can read the active workspace
 * without importing it: the provider itself calls those hooks, and a cycle
 * between the two modules is the kind of thing that works until a bundler
 * reorders it.
 */
export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  isLoading: true,
  switchWorkspace: () => undefined,
});

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
