"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True after hydration, false during SSR — the lint-safe replacement for the
 * classic `useEffect(() => setMounted(true))` pattern. Used to defer
 * theme-dependent UI that would otherwise mismatch between server and client.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
