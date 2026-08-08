"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_ORDER, type TaskStatus } from "@/lib/types";

export type ViewMode = "list" | "board";

export type TaskField =
  "priority" | "members" | "dueDate" | "labels" | "status" | "reporter";

export interface ViewPrefs {
  mode: ViewMode;
  fields: Record<TaskField, boolean>;
  /** Board column order (drag the column handle to rearrange). */
  columnOrder: TaskStatus[];
  /** Columns collapsed to a narrow strip. */
  collapsedColumns: TaskStatus[];
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
  columnOrder: STATUS_ORDER,
  collapsedColumns: [],
};

/** Drops unknown/duplicate statuses and appends any column missing from storage. */
function normalizeColumnOrder(stored: unknown): TaskStatus[] {
  if (!Array.isArray(stored)) return STATUS_ORDER;
  const valid = stored.filter(
    (status, index): status is TaskStatus =>
      STATUS_ORDER.includes(status as TaskStatus) && stored.indexOf(status) === index,
  );
  const missing = STATUS_ORDER.filter((status) => !valid.includes(status));
  return [...valid, ...missing];
}

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
          columnOrder: normalizeColumnOrder(parsed.columnOrder),
          collapsedColumns: Array.isArray(parsed.collapsedColumns)
            ? parsed.collapsedColumns.filter((status): status is TaskStatus =>
                STATUS_ORDER.includes(status as TaskStatus),
              )
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

  const setColumnOrder = useCallback(
    (columnOrder: TaskStatus[]) => update({ columnOrder }),
    [update],
  );

  const toggleColumnCollapsed = useCallback(
    (status: TaskStatus) =>
      update((current) => ({
        ...current,
        collapsedColumns: current.collapsedColumns.includes(status)
          ? current.collapsedColumns.filter((s) => s !== status)
          : [...current.collapsedColumns, status],
      })),
    [update],
  );

  const resetLayout = useCallback(
    () => update({ columnOrder: STATUS_ORDER, collapsedColumns: [] }),
    [update],
  );

  return {
    prefs,
    hydrated,
    setMode,
    toggleField,
    setColumnOrder,
    toggleColumnCollapsed,
    resetLayout,
  };
}
