"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "list" | "board";

export type TaskField =
  | "priority"
  | "members"
  | "dueDate"
  | "labels"
  | "status"
  | "reporter";

export interface ViewPrefs {
  mode: ViewMode;
  fields: Record<TaskField, boolean>;
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
};

/** View mode + visible fields (the "Fields" dropdown), persisted per surface. */
export function useViewPrefs(storageKey: string) {
  const [prefs, setPrefs] = useState<ViewPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ViewPrefs>;
        setPrefs({
          mode: parsed.mode === "list" ? "list" : "board",
          fields: { ...DEFAULT_PREFS.fields, ...parsed.fields },
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
        window.localStorage.setItem(storageKey, JSON.stringify(merged));
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

  return { prefs, hydrated, setMode, toggleField };
}
