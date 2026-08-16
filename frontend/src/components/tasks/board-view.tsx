"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronsLeftRight,
  ChevronsRightLeft,
  GripVertical,
  MoreHorizontal,
  Plus,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMoveTask } from "@/hooks/use-api";
import type { ViewPrefs } from "@/hooks/use-view-prefs";
import { columnDotClass, type BoardColumn, type Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

interface BoardViewProps {
  tasks: Task[];
  columns: BoardColumn[];
  fields: ViewPrefs["fields"];
  collapsedColumns?: string[];
  canReorder?: boolean;
  onAddTask: (columnId: string) => void;
  onColumnOrderChange?: (columnIds: string[]) => void;
  onToggleCollapsed?: (columnId: string) => void;
  onManageColumn?: (column: BoardColumn) => void;
  onAddColumn?: () => void;
}

interface ColumnProps {
  column: BoardColumn;
  tasks: Task[];
  fields: ViewPrefs["fields"];
  collapsed: boolean;
  canReorder: boolean;
  onAddTask: (columnId: string) => void;
  onToggleCollapsed?: (columnId: string) => void;
  onManageColumn?: (column: BoardColumn) => void;
}

function BoardColumnPanel({
  column,
  tasks,
  fields,
  collapsed,
  canReorder,
  onAddTask,
  onToggleCollapsed,
  onManageColumn,
}: ColumnProps) {
  const meta = { label: column.name, dotClass: columnDotClass(column.color) };
  const status = column.id;
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column" }, disabled: !canReorder });
  // Separate id from the sortable above: `useSortable` already registers a
  // droppable under the column id, and registering a second one with the same
  // id makes the two nodes fight over a single entry, so column drop targeting
  // (notably onto an empty column) becomes unreliable.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: dropzoneId(column.id),
    data: { type: "dropzone", status: column.id },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  if (collapsed) {
    return (
      <section
        ref={setSortableRef}
        style={style}
        aria-label={`${meta.label} column, collapsed`}
        className={cn(
          "flex w-12 shrink-0 flex-col items-center gap-3 rounded-xl border bg-muted/40 py-3",
          isDragging && "opacity-50",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label={`Expand ${meta.label} column`}
              onClick={() => onToggleCollapsed?.(status)}
            >
              <ChevronsLeftRight className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand {meta.label}</TooltipContent>
        </Tooltip>
        <span className="flex items-center gap-1.5 [writing-mode:vertical-rl]">
          <span className={cn("size-2 rounded-full", meta.dotClass)} aria-hidden />
          <span className="text-sm font-semibold whitespace-nowrap">{meta.label}</span>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </span>
      </section>
    );
  }

  return (
    <section
      ref={setSortableRef}
      style={style}
      aria-label={`${meta.label} column`}
      className={cn(
        "flex max-h-full w-[19rem] shrink-0 snap-start flex-col rounded-xl border bg-muted/40 transition-colors",
        isDragging && "opacity-50",
        isOver && "border-primary/40 bg-muted/70",
      )}
    >
      <header className="flex shrink-0 items-center gap-1.5 px-3 py-2.5">
        {canReorder ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-grab rounded text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
                aria-label={`Reorder ${meta.label} column`}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>Drag to reorder column</TooltipContent>
          </Tooltip>
        ) : null}
        <span className={cn("size-2 rounded-full", meta.dotClass)} aria-hidden />
        <h2 className="truncate text-sm font-semibold">{meta.label}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
        <span className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Add task to ${meta.label}`}
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => onAddTask(status)}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add task to {meta.label}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${meta.label} column options`}
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
            <DropdownMenuItem className="gap-2" onClick={() => onAddTask(status)}>
              <Plus className="size-4" aria-hidden />
              Add task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              onClick={() => onToggleCollapsed?.(status)}
            >
              <ChevronsRightLeft className="size-4" aria-hidden />
              Collapse column
            </DropdownMenuItem>
            {onManageColumn ? (
              <DropdownMenuItem className="gap-2" onClick={() => onManageColumn(column)}>
                <Settings2 className="size-4" aria-hidden />
                Edit column
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Only the cards scroll — the column header and footer stay in place. */}
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setDroppableRef}
          className="flex min-h-24 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2"
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} fields={fields} />
          ))}
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Add or Drop a task here
            </p>
          ) : null}
        </div>
      </SortableContext>

      <footer className="shrink-0 px-2.5 pb-2.5">
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

/** Droppable id for a column's card area, kept distinct from the column id. */
const DROPZONE_PREFIX = "dropzone:";
const dropzoneId = (columnId: string): string => `${DROPZONE_PREFIX}${columnId}`;

/** Fractional position between the drop target's neighbors. */
function positionBetween(before?: Task, after?: Task): number {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1000;
  if (after) return after.position / 2;
  return 1000;
}

export function BoardView({
  tasks,
  columns: boardColumns,
  fields,
  collapsedColumns = [],
  canReorder = false,
  onAddTask,
  onColumnOrderChange,
  onToggleCollapsed,
  onManageColumn,
  onAddColumn,
}: BoardViewProps) {
  const moveTask = useMoveTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Local echo of in-flight column changes so cards don't flicker back.
  const [override, setOverride] = useState<Record<string, string>>({});
  const columnOrder = useMemo(
    () => boardColumns.map((column) => column.id),
    [boardColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space picks a card up / drops it; Enter stays free to open the task.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const columns = useMemo(() => {
    const byColumn = new Map<string, Task[]>(
      boardColumns.map((column) => [column.id, []]),
    );
    for (const task of tasks) {
      const columnId = override[task.id] ?? task.columnId;
      byColumn.get(columnId)?.push(task);
    }
    for (const list of byColumn.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return byColumn;
  }, [tasks, override, boardColumns]);

  const isColumnId = (id: string): boolean => columnOrder.includes(id);

  /** True for a column itself or its card drop area — both mean "this column". */
  const isColumnTarget = (id: string): boolean =>
    isColumnId(id) || id.startsWith(DROPZONE_PREFIX);

  const findColumn = (id: string): string | undefined => {
    if (id.startsWith(DROPZONE_PREFIX)) {
      const columnId = id.slice(DROPZONE_PREFIX.length);
      return isColumnId(columnId) ? columnId : undefined;
    }
    if (isColumnId(id)) return id;
    const task = tasks.find((t) => t.id === id);
    return task ? (override[task.id] ?? task.columnId) : undefined;
  };

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (isColumnId(id)) return;
    setActiveTask(tasks.find((t) => t.id === id) ?? null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || isColumnId(String(active.id))) return;
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

    const activeId = String(active.id);
    const overId = String(over.id);

    // Column reorder
    if (isColumnId(activeId)) {
      const overColumn = findColumn(overId);
      if (overColumn && overColumn !== activeId) {
        const from = columnOrder.indexOf(activeId);
        const to = columnOrder.indexOf(overColumn);
        if (from >= 0 && to >= 0) {
          onColumnOrderChange?.(arrayMove(columnOrder, from, to));
        }
      }
      return;
    }

    const targetColumnId = findColumn(overId);
    const task = tasks.find((t) => t.id === activeId);
    if (!task || !targetColumnId) {
      setOverride({});
      return;
    }

    const column = (columns.get(targetColumnId) ?? []).filter((t) => t.id !== task.id);
    let index = column.length;
    if (!isColumnTarget(overId)) {
      const overIndex = column.findIndex((t) => t.id === overId);
      if (overIndex >= 0) index = overIndex;
    }
    const position = positionBetween(column[index - 1], column[index]);

    // Nothing actually changed — skip the round trip.
    if (task.columnId === targetColumnId && task.position === position) {
      setOverride({});
      return;
    }

    moveTask.mutate(
      { id: task.id, columnId: targetColumnId, position },
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
      onDragCancel={() => {
        setActiveTask(null);
        setOverride({});
      }}
    >
      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
        <div
          className="flex min-h-0 flex-1 snap-x gap-4 overflow-x-auto px-4 pb-6 sm:px-6"
          data-tour="board"
        >
          {boardColumns.map((column) => (
            <BoardColumnPanel
              key={column.id}
              column={column}
              tasks={columns.get(column.id) ?? []}
              fields={fields}
              collapsed={collapsedColumns.includes(column.id)}
              canReorder={canReorder}
              onAddTask={onAddTask}
              onToggleCollapsed={onToggleCollapsed}
              onManageColumn={onManageColumn}
            />
          ))}

          {onAddColumn ? (
            <button
              type="button"
              onClick={onAddColumn}
              className="flex h-fit w-[13rem] shrink-0 items-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus className="size-4" aria-hidden />
              Add column
            </button>
          ) : null}
        </div>
      </SortableContext>
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
