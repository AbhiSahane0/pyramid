"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { useLabels, useMembers } from "@/hooks/use-api";
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  type Priority,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { PriorityIcon } from "./priority-badge";

const STATUS_OPTIONS: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "DOING",
  "COMPLETED",
  "ON_HOLD",
];

export function StatusDot({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn("size-2 rounded-full", STATUS_META[status].dotClass, className)}
      aria-hidden
    />
  );
}

interface PickerProps<T> {
  value: T;
  onChange: (value: T) => void;
  trigger: ReactNode;
  align?: "start" | "end";
}

export function StatusPicker({ value, onChange, trigger, align = "end" }: PickerProps<TaskStatus>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Status
        </DropdownMenuLabel>
        {STATUS_OPTIONS.map((status) => (
          <DropdownMenuItem key={status} onClick={() => onChange(status)} className="gap-2">
            <StatusDot status={status} />
            {STATUS_META[status].label}
            {value === status ? <Check className="ml-auto size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PriorityPicker({ value, onChange, trigger, align = "end" }: PickerProps<Priority>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Priority
        </DropdownMenuLabel>
        {PRIORITY_ORDER.map((priority) => (
          <DropdownMenuItem
            key={priority}
            onClick={() => onChange(priority)}
            className={cn("gap-2", PRIORITY_META[priority].textClass)}
          >
            <PriorityIcon priority={priority} />
            {PRIORITY_META[priority].label}
            {value === priority ? (
              <Check className="ml-auto size-4 text-foreground" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MultiPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  trigger: ReactNode;
  align?: "start" | "end";
}

export function MemberPicker({ value, onChange, trigger, align = "end" }: MultiPickerProps) {
  const { data: members = [] } = useMembers();

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-80 w-56 overflow-y-auto rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Members
        </DropdownMenuLabel>
        {members.map((member) => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={value.includes(member.id)}
            onCheckedChange={() => toggle(member.id)}
            onSelect={(event) => event.preventDefault()}
            className="gap-2"
          >
            <UserAvatar name={member.name} avatarUrl={member.avatarUrl} className="size-5" />
            {member.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LabelPicker({ value, onChange, trigger, align = "end" }: MultiPickerProps) {
  const { data: labels = [] } = useLabels();

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-80 w-52 overflow-y-auto rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Labels
        </DropdownMenuLabel>
        {labels.map((label) => (
          <DropdownMenuCheckboxItem
            key={label.id}
            checked={value.includes(label.id)}
            onCheckedChange={() => toggle(label.id)}
            onSelect={(event) => event.preventDefault()}
          >
            {label.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
