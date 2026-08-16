"use client";

import { createContext, useContext } from "react";
import { PRIORITY_ORDER, type Priority, type TaskFilters } from "@/lib/types";

/** The filters the board narrows by. `search` and `projectId` are not here:
 * search has its own input, and the project comes from the route. */
export type BoardFilters = Omit<TaskFilters, "search" | "projectId">;

/** Where the board lives when the user is not already looking at one. */
export const DEFAULT_BOARD_PATH = "/tasks";

export function isBoardPath(pathname: string): boolean {
  return pathname === DEFAULT_BOARD_PATH || pathname.startsWith("/projects/");
}

/** The query keys the board owns. Anything else in the URL is left alone. */
const FILTER_KEYS = ["columnId", "priority", "memberId", "labelId"] as const;

/** Search rides in the URL too, under a short key people can read and edit. */
export const SEARCH_KEY = "q";

/**
 * Reads filters out of a query string.
 *
 * The URL is user-editable, so nothing here is trusted: `priority` is checked
 * against the enum the API accepts, because a hand-typed `?priority=URGNET`
 * would otherwise travel to the server and come back as a validation error the
 * user cannot connect to anything they did. Ids are passed through — a stale
 * one simply matches no tasks, which explains itself on screen.
 */
export function filtersFromParams(params: URLSearchParams): BoardFilters {
  const filters: BoardFilters = {};
  const columnId = params.get("columnId");
  const memberId = params.get("memberId");
  const labelId = params.get("labelId");
  const priority = params.get("priority");

  if (columnId) filters.columnId = columnId;
  if (memberId) filters.memberId = memberId;
  if (labelId) filters.labelId = labelId;
  if (priority && PRIORITY_ORDER.includes(priority as Priority)) {
    filters.priority = priority as Priority;
  }
  return filters;
}

/** Applies a patch to a query string, dropping keys set to undefined. */
export function paramsWithFilters(
  current: URLSearchParams,
  patch: BoardFilters,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of FILTER_KEYS) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}

/** Strips the board's own keys, leaving anything else the URL carries. */
export function paramsWithoutFilters(current: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of FILTER_KEYS) next.delete(key);
  return next;
}

/**
 * Strips filters and search together.
 *
 * Doing it in one pass is the point. Calling the two clearers in sequence
 * looks equivalent but is not: both read the query string from the render
 * they were created in, so the second write is computed from a URL the first
 * has already replaced, and puts back what the first removed.
 */
export function paramsWithoutBoardState(current: URLSearchParams): URLSearchParams {
  const next = paramsWithoutFilters(current);
  next.delete(SEARCH_KEY);
  return next;
}

export function searchFromParams(params: URLSearchParams): string {
  return params.get(SEARCH_KEY) ?? "";
}

export interface TaskFilterContextValue {
  filters: BoardFilters;
  /** Merges — setting a column filter must not drop a priority filter. */
  patchFilters: (patch: BoardFilters) => void;
  clearFilters: () => void;
  /** The committed search term. The input keeps its own instant copy. */
  search: string;
  setSearch: (term: string) => void;
  /** Filters and search at once — see paramsWithoutBoardState. */
  clearAll: () => void;
}

/**
 * Split from the provider so the assistant can reach the board's filters.
 *
 * The two live in different subtrees — the board is a page, the assistant is
 * mounted beside it in the app layout — so there is no prop path between them.
 */
export const TaskFilterContext = createContext<TaskFilterContextValue>({
  filters: {},
  patchFilters: () => undefined,
  clearFilters: () => undefined,
  search: "",
  setSearch: () => undefined,
  clearAll: () => undefined,
});

export function useTaskFilters(): TaskFilterContextValue {
  return useContext(TaskFilterContext);
}
