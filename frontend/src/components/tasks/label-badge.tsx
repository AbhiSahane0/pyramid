import { Tag } from "lucide-react";
import type { Label } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Tag chip used on cards and the task detail labels row. */
export function LabelBadge({ label, className }: { label: Label; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        className,
      )}
    >
      <Tag className="size-3 text-muted-foreground" aria-hidden />
      {label.name}
    </span>
  );
}
