"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import type { ViewPrefs } from "@/hooks/use-view-prefs";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DueDateChip } from "./due-date-chip";
import { LabelBadge } from "./label-badge";
import { TaskActionsMenu } from "./task-actions-menu";

interface TaskCardProps {
  task: Task;
  fields: ViewPrefs["fields"];
  /** Static rendering for the DragOverlay ghost. */
  overlay?: boolean;
}

/** Kanban card: title + actions, assignee chip, due date, labels. */
export function TaskCard({ task, fields, overlay }: TaskCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task }, disabled: overlay });

  const firstMember = task.members[0];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/tasks/${task.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(`/tasks/${task.id}`);
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-card-foreground shadow-xs outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{task.title}</p>
        <TaskActionsMenu
          task={task}
          className="-mr-1.5 -mt-1 size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        />
      </div>

      {(fields.members && firstMember) || (fields.dueDate && task.dueDate) ? (
        <div className="flex items-center justify-between gap-2">
          {fields.members && firstMember ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground">
              <UserAvatar
                name={firstMember.name}
                avatarUrl={firstMember.avatarUrl}
                className="size-5"
              />
              <span className="truncate">{firstMember.name}</span>
              {task.members.length > 1 ? (
                <span className="text-muted-foreground">+{task.members.length - 1}</span>
              ) : null}
            </span>
          ) : (
            <span />
          )}
          {fields.dueDate && task.dueDate ? <DueDateChip date={task.dueDate} /> : null}
        </div>
      ) : null}

      {fields.labels && task.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {task.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
          {task.labels.length > 3 ? (
            <span className="self-center text-xs text-muted-foreground">
              +{task.labels.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
