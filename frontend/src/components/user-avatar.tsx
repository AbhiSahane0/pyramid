"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${second}`.toUpperCase();
}

/** Round avatar with image or initials fallback, e.g. "CN". */
export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("size-7", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className="bg-muted text-[0.6rem] font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
