"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const COLOR_MODES = ["amber", "blue", "pink", "rose", "emerald", "black"] as const;

export type ColorMode = (typeof COLOR_MODES)[number];

export const COLOR_MODE_STORAGE_KEY = "pyramid-color-mode";
const DEFAULT_COLOR_MODE: ColorMode = "black";

interface ColorModeContextValue {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  colorMode: DEFAULT_COLOR_MODE,
  setColorMode: () => undefined,
});

function readStoredMode(): ColorMode {
  if (typeof window === "undefined") return DEFAULT_COLOR_MODE;
  const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  return COLOR_MODES.includes(stored as ColorMode)
    ? (stored as ColorMode)
    : DEFAULT_COLOR_MODE;
}

/**
 * Accent color theming ("Color Mode" in the user menu). A tiny inline script
 * in the root layout applies the stored value before hydration, so there is
 * never a flash of the wrong accent; this provider takes over afterwards.
 */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredMode);

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === "black") {
      delete root.dataset.colorMode;
    } else {
      root.dataset.colorMode = colorMode;
    }
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  }, [colorMode]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  return (
    <ColorModeContext.Provider value={{ colorMode, setColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext);
}
