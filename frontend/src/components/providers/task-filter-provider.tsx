"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  boardPathFor,
  TaskFilterContext,
  type BoardFilters,
} from "@/components/providers/task-filter-context";

/** Stable identity, so a board with no filters doesn't churn the context. */
const NO_FILTERS: BoardFilters = {};

interface Scoped {
  /** The board these filters were set for. */
  boardPath: string;
  filters: BoardFilters;
}

/**
 * Holds the board's filters above both the board and the assistant.
 *
 * Filters belong to a board rather than to a page: narrowing the workspace
 * board to "High priority" and then opening a project should show that
 * project, not a slice of it the user set elsewhere and has already forgotten.
 * Pages that are not boards resolve to the default board, so running @filter
 * from Settings sets the filter on the board it then sends you to instead of
 * losing it in the navigation.
 *
 * Comparing the stored board during render rather than resetting from an
 * effect means a different board is unfiltered on its first paint, with no
 * flash of the previous board's filter.
 */
export function TaskFilterProvider({ children }: { children: ReactNode }) {
  const boardPath = boardPathFor(usePathname());
  const [scoped, setScoped] = useState<Scoped>({ boardPath, filters: {} });

  const patchFilters = useCallback(
    (patch: BoardFilters) => {
      setScoped((current) => ({
        boardPath,
        filters: {
          ...(current.boardPath === boardPath ? current.filters : {}),
          ...patch,
        },
      }));
    },
    [boardPath],
  );

  const clearFilters = useCallback(
    () => setScoped({ boardPath, filters: {} }),
    [boardPath],
  );

  const value = useMemo(
    () => ({
      filters: scoped.boardPath === boardPath ? scoped.filters : NO_FILTERS,
      patchFilters,
      clearFilters,
    }),
    [scoped, boardPath, patchFilters, clearFilters],
  );

  return (
    <TaskFilterContext.Provider value={value}>{children}</TaskFilterContext.Provider>
  );
}
