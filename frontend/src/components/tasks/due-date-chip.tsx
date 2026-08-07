import { format, isPast, isToday } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rounded date chip from the board cards — red when overdue. */
export function DueDateChip({ date, className }: { date: string; className?: string }) {
  const parsed = new Date(date);
  const overdue = isPast(parsed) && !isToday(parsed);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        overdue
          ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <CalendarDays className="size-3" aria-hidden />
      {format(parsed, "dd MMM")}
    </span>
  );
}
