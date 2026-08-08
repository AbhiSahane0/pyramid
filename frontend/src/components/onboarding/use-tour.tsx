"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useMe } from "@/hooks/use-api";

interface TourContextValue {
  isOpen: boolean;
  start: () => void;
  stop: () => void;
}

const TourContext = createContext<TourContextValue>({
  isOpen: false,
  start: () => undefined,
  stop: () => undefined,
});

/** Per-account so a shared browser still shows the tour to each new user. */
function storageKey(userId: string): string {
  return `pyramid-tour-done:${userId}`;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { data: user } = useMe();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-run once per account, after the shell has painted so targets exist.
  useEffect(() => {
    if (!user) return;
    let seen = true;
    try {
      seen = window.localStorage.getItem(storageKey(user.id)) === "1";
    } catch {
      // Storage blocked — don't nag on every load.
    }
    if (seen) return;
    // Let the shell (sidebar included) finish mounting so every step resolves.
    const timer = setTimeout(() => setIsOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [user]);

  const start = useCallback(() => setIsOpen(true), []);

  const stop = useCallback(() => {
    setIsOpen(false);
    if (!user) return;
    try {
      window.localStorage.setItem(storageKey(user.id), "1");
    } catch {
      // Non-fatal: the tour will simply offer itself again next session.
    }
  }, [user]);

  return (
    <TourContext.Provider value={{ isOpen, start, stop }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  return useContext(TourContext);
}
