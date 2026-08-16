"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TypeToConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** The exact text the user has to reproduce — shown, copyable, and compared. */
  confirmationText: string;
  /** Sentence above the input, e.g. "Type the workspace name to confirm". */
  prompt: string;
  confirmLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * The confirmation for things that cannot be undone.
 *
 * A second "are you sure?" is muscle memory by the time someone has deleted
 * two of anything; reproducing the name is not. The name is offered with a
 * copy button so the deliberate path is still quick — pasting is a choice,
 * where clicking through is a reflex.
 */
export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationText,
  prompt,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  pending = false,
  onConfirm,
}: TypeToConfirmDialogProps) {
  const inputId = useId();
  const nameRef = useRef<HTMLElement>(null);
  const [typed, setTyped] = useState("");
  const [copied, setCopied] = useState(false);

  // Trailing spaces survive a paste from some browsers; they are not a
  // meaningful difference, so don't fail someone for them.
  const matches = typed.trim() === confirmationText.trim();

  const close = () => {
    setTyped("");
    setCopied(false);
    onOpenChange(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(confirmationText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused outright (permissions policy, an
      // insecure origin, a browser that wants a trusted gesture). Select the
      // name instead so the keyboard shortcut still works — a dead button
      // would just leave the user retyping.
      const node = nameRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-sm font-normal">
            {prompt}
          </Label>

          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <code ref={nameRef} className="min-w-0 truncate font-mono text-sm select-all">
              {confirmationText}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              aria-label={copied ? "Copied" : "Copy name"}
              disabled={pending}
              onClick={() => void copy()}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
            </Button>
          </div>

          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={confirmationText}
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
            aria-invalid={typed.length > 0 && !matches}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches && !pending) {
                event.preventDefault();
                onConfirm();
              }
            }}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches || pending}
            className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
