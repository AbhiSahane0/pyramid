"use client";

import { CircleQuestionMark, Compass, Keyboard, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { useTour } from "@/components/onboarding/use-tour";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["⌘", "F"], action: "Search tasks" },
  { keys: ["Enter"], action: "Open the focused task card" },
  { keys: ["Space"], action: "Pick up / drop a card (keyboard drag)" },
  { keys: ["Esc"], action: "Close a dialog, menu or the tour" },
  { keys: ["→", "←"], action: "Next / previous step during the tour" },
];

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-6 rounded border bg-muted px-1.5 py-0.5 text-center text-[0.7rem] font-medium text-muted-foreground"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

/** Topbar help: replay the product tour or review keyboard shortcuts. */
export function HelpMenu() {
  const { start } = useTour();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label="Help and product tour"
                data-tour="help"
              >
                <CircleQuestionMark className="size-4.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Help &amp; tour</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Help
          </DropdownMenuLabel>
          <DropdownMenuItem className="gap-2" onClick={start}>
            <Compass className="size-4" aria-hidden />
            Take the product tour
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setShortcutsOpen(true)}>
            <Keyboard className="size-4" aria-hidden />
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="gap-2">
            <a href="/api/docs" target="_blank" rel="noreferrer">
              <LifeBuoy className="size-4" aria-hidden />
              API documentation
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Move faster without leaving the keyboard.
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y">
            {SHORTCUTS.map((shortcut) => (
              <li
                key={shortcut.action}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="text-sm">{shortcut.action}</span>
                <Keys keys={shortcut.keys} />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
