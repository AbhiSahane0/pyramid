"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "list" | "board";

export type TaskField =
  "priority" | "members" | "dueDate" | "labels" | "status" | "reporter";

export interface ViewPrefs {
  mode: ViewMode;
  fields: Record<TaskField, boolean>;
  /**
   * Columns collapsed to a narrow strip, by column id. Personal, unlike the
   * order — collapsing a column is how one person clears their view, not a
   * change to the team's board.
   */
  collapsedColumns: string[];
}

const DEFAULT_PREFS: ViewPrefs = {
  mode: "board",
  fields: {
    priority: true,
    members: true,
    dueDate: true,
    labels: true,
    status: false,
    reporter: false,
  },
  collapsedColumns: [],
};

/** View mode, visible fields and board layout — persisted per surface. */
export function useViewPrefs(storageKey: string) {
  const [prefs, setPrefs] = useState<ViewPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  // One-time hydration read: localStorage is only available on the client, so
  // the stored preferences are applied right after mount. The sync setState is
  // intentional — it must land before the first paint of the view toggle.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ViewPrefs>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs({
          mode: parsed.mode === "list" ? "list" : "board",
          fields: { ...DEFAULT_PREFS.fields, ...parsed.fields },
          collapsedColumns: Array.isArray(parsed.collapsedColumns)
            ? parsed.collapsedColumns.filter((id): id is string => typeof id === "string")
            : [],
        });
      }
    } catch {
      // Corrupt storage — fall back to defaults.
    }
    setHydrated(true);
  }, [storageKey]);

  const update = useCallback(
    (next: Partial<ViewPrefs> | ((current: ViewPrefs) => ViewPrefs)) => {
      setPrefs((current) => {
        const merged =
          typeof next === "function" ? next(current) : { ...current, ...next };
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(merged));
        } catch {
          // Storage full or blocked (private mode) — keep the in-memory value.
        }
        return merged;
      });
    },
    [storageKey],
  );

  const setMode = useCallback((mode: ViewMode) => update({ mode }), [update]);

  const toggleField = useCallback(
    (field: TaskField) =>
      update((current) => ({
        ...current,
        fields: { ...current.fields, [field]: !current.fields[field] },
      })),
    [update],
  );

  const toggleColumnCollapsed = useCallback(
    (columnId: string) =>
      update((current) => ({
        ...current,
        collapsedColumns: current.collapsedColumns.includes(columnId)
          ? current.collapsedColumns.filter((id) => id !== columnId)
          : [...current.collapsedColumns, columnId],
      })),
    [update],
  );

  const resetLayout = useCallback(() => update({ collapsedColumns: [] }), [update]);

  return {
    prefs,
    hydrated,
    setMode,
    toggleField,
    toggleColumnCollapsed,
    resetLayout,
  };
}
