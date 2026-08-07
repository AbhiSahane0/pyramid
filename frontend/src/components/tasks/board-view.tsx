"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMoveTask } from "@/hooks/use-api";
import type { ViewPrefs } from "@/hooks/use-view-prefs";
import {
  STATUS_META,
  STATUS_ORDER,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

interface BoardViewProps {
  tasks: Task[];
  fields: ViewPrefs["fields"];
  onAddTask: (status: TaskStatus) => void;
}

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  fields: ViewPrefs["fields"];
  onAddTask: (status: TaskStatus) => void;
}

function BoardColumn({ status, tasks, fields, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${meta.label} column`}
      className={cn(
        "flex w-[19rem] shrink-0 snap-start flex-col rounded-xl border bg-muted/40 transition-colors",
        isOver && "border-ring/40 bg-muted/70",
      )}
    >
      <header className="flex items-center gap-1.5 px-3 py-2.5">
        <GripVertical className="size-4 text-muted-foreground/60" aria-hidden />
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Add task to ${meta.label}`}
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${meta.label} column options`}
          className="size-6 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </header>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-16 flex-1 flex-col gap-2.5 px-2.5 pb-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} fields={fields} />
          ))}
        </div>
      </SortableContext>

      <footer className="px-2.5 pb-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="size-4" aria-hidden />
          Add Task
        </Button>
      </footer>
    </section>
  );
}

/** Fractional position between the drop target's neighbors. */
function positionBetween(before?: Task, after?: Task): number {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1000;
  if (after) return after.position / 2;
  return 1000;
}

export function BoardView({ tasks, fields, onAddTask }: BoardViewProps) {
  const moveTask = useMoveTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Local echo of in-flight column changes so cards don't flicker back.
  const [override, setOverride] = useState<Record<string, TaskStatus>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    const byStatus = new Map<TaskStatus, Task[]>(
      STATUS_ORDER.map((status) => [status, []]),
    );
    for (const task of tasks) {
      const status = override[task.id] ?? task.status;
      byStatus.get(status)?.push(task);
    }
    for (const list of byStatus.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return byStatus;
  }, [tasks, override]);

  const findColumn = (id: string): TaskStatus | undefined => {
    if (STATUS_ORDER.includes(id as TaskStatus)) return id as TaskStatus;
    const task = tasks.find((t) => t.id === id);
    return task ? (override[task.id] ?? task.status) : undefined;
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (from && to && from !== to) {
      setOverride((current) => ({ ...current, [String(active.id)]: to }));
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) {
      setOverride({});
      return;
    }

    const targetStatus = findColumn(String(over.id));
    const task = tasks.find((t) => t.id === active.id);
    if (!task || !targetStatus) {
      setOverride({});
      return;
    }

    const column = (columns.get(targetStatus) ?? []).filter((t) => t.id !== task.id);
    let index = column.length;
    if (over.id !== targetStatus) {
      const overIndex = column.findIndex((t) => t.id === over.id);
      if (overIndex >= 0) index = overIndex;
    }
    const position = positionBetween(column[index - 1], column[index]);

    moveTask.mutate(
      { id: task.id, status: targetStatus, position },
      { onSettled: () => setOverride({}) },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-1 snap-x gap-4 overflow-x-auto px-4 pb-6 sm:px-6">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns.get(status) ?? []}
            fields={fields}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[18rem]">
            <TaskCard task={activeTask} fields={fields} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
