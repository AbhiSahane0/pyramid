"use client";

import { Check } from "lucide-react";
import {
  COLOR_MODES,
  useColorMode,
  type ColorMode,
} from "@/components/providers/color-mode-provider";
import { cn } from "@/lib/utils";

const SWATCHES: Record<ColorMode, string> = {
  amber: "bg-amber-600",
  blue: "bg-violet-600",
  pink: "bg-pink-600",
  rose: "bg-rose-600",
  emerald: "bg-emerald-600",
  black: "bg-zinc-900 dark:bg-zinc-100",
};

export default function ColorSettingsPage() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Color</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the accent color used for buttons and highlights.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {COLOR_MODES.map((mode) => {
          const selected = colorMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setColorMode(mode)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium capitalize transition-colors",
                selected
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <span className={cn("size-6 rounded-lg", SWATCHES[mode])} aria-hidden />
              {mode}
              {selected ? <Check className="ml-auto size-4" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
