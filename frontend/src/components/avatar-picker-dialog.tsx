"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useAvatarOptions, useUpdateProfile } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  currentAvatarUrl: string | null;
}

/**
 * Picks from a set of generated faces. The options come from the API so the
 * catalogue lives in one place, and the grid is deliberately small — this is a
 * profile picture, not a design tool.
 */
export function AvatarPickerDialog({
  open,
  onOpenChange,
  name,
  currentAvatarUrl,
}: AvatarPickerDialogProps) {
  const { data, isPending } = useAvatarOptions(open);
  const updateProfile = useUpdateProfile();
  // Only an explicit click is stored; everything else falls back to what is
  // saved. Dropping it on close is what makes reopening after a cancel show
  // the real picture rather than the abandoned choice.
  const [choice, setChoice] = useState<string | null>(null);
  const selected = choice ?? currentAvatarUrl;

  const close = () => {
    setChoice(null);
    onOpenChange(false);
  };

  const options = data?.options ?? [];
  // A Google photo isn't in the generated set; keep it offered so choosing a
  // face isn't a one-way door.
  const all =
    currentAvatarUrl && !options.includes(currentAvatarUrl)
      ? [currentAvatarUrl, ...options]
      : options;

  const save = () => {
    if (!selected || selected === currentAvatarUrl) {
      close();
      return;
    }
    updateProfile.mutate({ avatarUrl: selected }, { onSuccess: close });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a profile picture</DialogTitle>
          <DialogDescription>
            Pick the one that looks most like you. You can change it whenever you like.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="grid grid-cols-4 gap-3 py-2 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-full" />
            ))}
          </div>
        ) : (
          <div className="grid max-h-72 grid-cols-4 gap-3 overflow-y-auto py-2 sm:grid-cols-5">
            {all.map((option) => {
              const active = option === selected;
              return (
                <button
                  key={option}
                  type="button"
                  aria-label="Use this picture"
                  aria-pressed={active}
                  onClick={() => setChoice(option)}
                  className={cn(
                    "relative rounded-full ring-offset-2 ring-offset-background transition",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-border",
                  )}
                >
                  <UserAvatar
                    name={name}
                    avatarUrl={option}
                    className="size-full aspect-square"
                  />
                  {active ? (
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-2.5" aria-hidden />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={updateProfile.isPending}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!selected || updateProfile.isPending}
            className="gap-1.5"
          >
            {updateProfile.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {updateProfile.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
