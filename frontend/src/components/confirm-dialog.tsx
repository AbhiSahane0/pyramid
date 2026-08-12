"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  /** Shown on the confirm button while the action runs. */
  pendingLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for actions that destroy data. */
  destructive?: boolean;
  /** Keeps the dialog open, swaps in a spinner and blocks both buttons. */
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation step for consequential actions, with the in-flight state built
 * in: the dialog stays open while the request runs so the spinner is visible
 * and the action can't be fired twice, and the caller closes it on success.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      // Ignore dismiss attempts (Esc, outside click) while the request is in
      // flight, so the user can't lose sight of an action still running.
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(
              "gap-1.5",
              destructive && "bg-destructive text-white hover:bg-destructive/90",
            )}
            // Radix closes on click by default; prevent that so the dialog can
            // show progress. The caller closes it once the request settles.
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
