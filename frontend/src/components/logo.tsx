import { cn } from "@/lib/utils";

/** The Pyramid mark: rounded black tile with a wireframe pyramid. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[62%]"
        aria-hidden
      >
        <path d="M12 3 4 18h16L12 3Z" />
        <path d="M12 3v15" />
        <path d="M12 18 4 18" />
      </svg>
    </span>
  );
}
