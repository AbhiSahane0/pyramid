"use client";

import { createContext, useContext } from "react";
import type { TaskFilters } from "@/lib/types";

/** The filters the board narrows by. `search` and `projectId` are not here:
 * search has its own input, and the project comes from the route. */
export type BoardFilters = Omit<TaskFilters, "search" | "projectId">;

/** Where the board lives when the user is not already looking at one. */
export const DEFAULT_BOARD_PATH = "/tasks";

export function isBoardPath(pathname: string): boolean {
  return pathname === DEFAULT_BOARD_PATH || pathname.startsWith("/projects/");
}

/**
 * The board a filter belongs to.
 *
 * Filters are scoped to a board, not to whatever page happens to be open:
 * running @filter from Settings has to record the filter against the board it
 * is about to send you to, or the navigation would land somewhere the filter
 * does not apply and drop it on arrival.
 */
export function boardPathFor(pathname: string): string {
  return isBoardPath(pathname) ? pathname : DEFAULT_BOARD_PATH;
}

export interface TaskFilterContextValue {
  filters: BoardFilters;
  /** Merges — setting a column filter must not drop a priority filter. */
  patchFilters: (patch: BoardFilters) => void;
  clearFilters: () => void;
}

/**
 * Split from the provider so the assistant can reach the board's filters.
 *
 * The two live in different subtrees — the board is a page, the assistant is
 * mounted beside it in the app layout — so there is no prop path between them.
 * Everything else the assistant does goes through the API and comes back via
 * query invalidation; filters never touch the server, so they need somewhere
 * shared to live.
 */
export const TaskFilterContext = createContext<TaskFilterContextValue>({
  filters: {},
  patchFilters: () => undefined,
  clearFilters: () => undefined,
});

export function useTaskFilters(): TaskFilterContextValue {
  return useContext(TaskFilterContext);
}
