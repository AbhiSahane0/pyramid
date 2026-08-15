"use client";

import { CornerDownLeft, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface PickerItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  group?: string;
  /** Rendered in a muted, italic style — used for "Skip" rows. */
  muted?: boolean;
}

interface PickerListProps {
  items: PickerItem[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (item: PickerItem) => void;
  emptyLabel: string;
  /** Shown above the list so the user always knows what they're choosing. */
  title?: string;
}

/**
 * Keyboard-first option list, shared by the "@" command menu and every step
 * that picks from a set. Selection is driven by the composer's key handler —
 * this component only renders and reports hover, so there is a single source
 * of truth for which row is active.
 */
export function PickerList({
  items,
  activeIndex,
  onHover,
  onSelect,
  emptyLabel,
  title,
}: PickerListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
      {title ? (
        <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="max-h-56 overflow-y-auto p-1" role="listbox">
          {items.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;
            const newGroup = item.group && item.group !== items[index - 1]?.group;

            return (
              <li key={item.id}>
                {newGroup ? (
                  <p className="px-2 pt-2 pb-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
                    {item.group}
                  </p>
                ) : null}
                <button
                  ref={active ? activeRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseMove={() => onHover(index)}
                  // Mouse down would blur the composer before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                    active ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  {Icon ? (
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        item.muted && "text-muted-foreground italic",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {active ? (
                    <CornerDownLeft
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
