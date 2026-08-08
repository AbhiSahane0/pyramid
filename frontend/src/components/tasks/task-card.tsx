"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, ListTree } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { ViewPrefs } from "@/hooks/use-view-prefs";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DueDateChip } from "./due-date-chip";
import { LabelBadge } from "./label-badge";
import { PriorityIcon } from "./priority-badge";
import { TaskActionsMenu } from "./task-actions-menu";

interface TaskCardProps {
  task: Task;
  fields: ViewPrefs["fields"];
  /** Static rendering for the DragOverlay ghost. */
  overlay?: boolean;
}

/** Drag past this many pixels and the release is a drop, not a click. */
const CLICK_SLOP = 6;

/** Kanban card: title + actions, assignee chip, due date, labels. */
export function TaskCard({ task, fields, overlay }: TaskCardProps) {
  const router = useRouter();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task }, disabled: overlay });

  const firstMember = task.members[0];
  const open = () => router.push(`/tasks/${task.id}`);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Open task ${task.title}`}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        // Ignore the click that follows a drag gesture.
        const start = pointerStart.current;
        pointerStart.current = null;
        if (
          start &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP
        ) {
          return;
        }
        open();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          open();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-card-foreground shadow-xs transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-3 text-sm leading-snug font-semibold break-words">
          {task.title}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {fields.priority && task.priority !== "NO_PRIORITY" ? (
            <PriorityIcon priority={task.priority} className="mt-0.5" />
          ) : null}
          <TaskActionsMenu
            task={task}
            className="-mt-1 -mr-1.5 size-6 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          />
        </div>
      </div>

      {(fields.members && firstMember) || (fields.dueDate && task.dueDate) ? (
        <div className="flex items-center justify-between gap-2">
          {fields.members && firstMember ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
              <UserAvatar
                name={firstMember.name}
                avatarUrl={firstMember.avatarUrl}
                className="size-5 shrink-0"
              />
              <span className="truncate">{firstMember.name}</span>
              {task.members.length > 1 ? (
                <span className="shrink-0 text-muted-foreground">
                  +{task.members.length - 1}
                </span>
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

      {task._count.subtasks > 0 || task._count.comments > 0 ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task._count.subtasks > 0 ? (
            <span className="flex items-center gap-1">
              <ListTree className="size-3.5" aria-hidden />
              <span className="tabular-nums">{task._count.subtasks}</span>
              <span className="sr-only">subtasks</span>
            </span>
          ) : null}
          {task._count.comments > 0 ? (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" aria-hidden />
              <span className="tabular-nums">{task._count.comments}</span>
              <span className="sr-only">comments</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
