import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/** Shared illustration + copy + call-to-action for empty, error and no-result views. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center",
        className,
      )}
    >
      <span
        className="flex size-14 items-center justify-center rounded-2xl border bg-muted/60 text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-6" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-balance text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
