"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Debounces a rapidly-changing value (e.g. search input → API filter). */
export function useDebounced<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Defers an action until the caller stops calling it.
 *
 * The value form above debounces state; this debounces the effect itself,
 * which is what you want when the trailing call writes somewhere outside
 * React — a URL, say. Doing that from an effect on a debounced value means
 * every keystroke schedules a render whose only purpose is to trigger a
 * navigation.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 250,
): (...args: Args) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Kept in a ref so a re-created callback doesn't restart the timer, and the
  // pending call still runs the newest version. Assigned after commit rather
  // than during render — a render can be thrown away, and this must only
  // track the version that actually made it to the screen.
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), delayMs);
    },
    [delayMs],
  );
}
