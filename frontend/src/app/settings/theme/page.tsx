"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun, preview: "bg-white text-zinc-900" },
  { value: "dark", label: "Dark", icon: Moon, preview: "bg-zinc-900 text-zinc-100" },
] as const;

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Pyramid looks. Your preference is saved on this device.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ value, label, icon: Icon, preview }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border-2 p-1 text-left transition-colors",
                selected ? "border-primary" : "border-border hover:border-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "flex h-28 flex-col justify-between rounded-lg border p-4",
                  preview,
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="space-y-1.5">
                  <span className="block h-2 w-2/3 rounded bg-current opacity-30" />
                  <span className="block h-2 w-1/2 rounded bg-current opacity-20" />
                </span>
              </span>
              <span className="flex items-center justify-between px-3 py-2.5 text-sm font-medium">
                {label}
                {selected ? <Check className="size-4" aria-hidden /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
