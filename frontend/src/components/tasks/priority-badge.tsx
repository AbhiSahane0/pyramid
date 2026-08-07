import { PRIORITY_META, type Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The ascending signal-bars glyph used everywhere priorities appear. */
export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const { bars, textClass } = PRIORITY_META[priority];
  if (bars === 0) {
    return (
      <span
        className={cn("flex size-3.5 items-end justify-center", textClass, className)}
        aria-hidden
      >
        <span className="mb-[3px] size-[3px] rounded-full bg-current" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-3.5 items-end justify-center gap-[1.5px]",
        textClass,
        className,
      )}
      aria-hidden
    >
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn("w-[2.5px] rounded-[1px] bg-current", bar > bars && "opacity-25")}
          style={{ height: `${3 + bar * 2.5}px` }}
        />
      ))}
    </span>
  );
}

/** Icon + colored label, e.g. "⠿ High" in list rows and detail sidebars. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        meta.textClass,
        className,
      )}
    >
      <PriorityIcon priority={priority} />
      {meta.label}
    </span>
  );
}
