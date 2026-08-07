"use client";

import { Plus } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MemberAvatarsProps {
  members: Member[];
  max?: number;
  /** Renders the trailing "+" affordance from the list view. */
  onAdd?: () => void;
  className?: string;
}

/** Overlapping avatar stack with an optional add button. */
export function MemberAvatars({ members, max = 3, onAdd, className }: MemberAvatarsProps) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  return (
    <span className={cn("flex items-center", className)}>
      <span className="flex -space-x-1.5">
        {shown.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <span className="rounded-full ring-2 ring-background">
                <UserAvatar name={member.name} avatarUrl={member.avatarUrl} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{member.name}</TooltipContent>
          </Tooltip>
        ))}
        {extra > 0 ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[0.6rem] font-medium ring-2 ring-background">
            +{extra}
          </span>
        ) : null}
      </span>
      {members.length === 0 && onAdd ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          aria-label="Add member"
          className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
