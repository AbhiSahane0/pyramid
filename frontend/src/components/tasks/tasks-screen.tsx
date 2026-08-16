"use client";

import { ListChecks, Plus, RotateCcw, SearchX, WifiOff } from "lucide-react";
import { useState } from "react";
import { useTaskFilters } from "@/components/providers/task-filter-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCanManageColumns,
  useColumns,
  useReorderColumns,
  useTasks,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { useViewPrefs } from "@/hooks/use-view-prefs";
import { ApiError } from "@/lib/api";
import type { BoardColumn, TaskFilters } from "@/lib/types";
import { BoardView } from "./board-view";
import { ColumnFormDialog } from "./column-form-dialog";
import { EmptyState } from "./empty-state";
import { ListView } from "./list-view";
import { TaskFormDialog } from "./task-form-dialog";
import { ViewHeader } from "./view-header";

interface TasksScreenProps {
  title?: string;
  /** Scopes the screen to one project (project detail page). */
  projectId?: string;
  /** localStorage key so each surface remembers its own view prefs. */
  storageKey: string;
}

function BoardSkeleton() {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden px-4 pb-6 sm:px-6">
      {[0, 1, 2, 3].map((column) => (
        <div
          key={column}
          className="flex w-[19rem] shrink-0 flex-col gap-2.5 rounded-xl border bg-muted/40 p-3"
        >
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 - (column % 2) }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-6 sm:px-6">
      {[0, 1].map((group) => (
        <div key={group} className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Tasks surface shared by the workspace Tasks page and project detail. */
export function TasksScreen({
  title = "Tasks",
  projectId,
  storageKey,
}: TasksScreenProps) {
  const { prefs, hydrated, setMode, toggleField, toggleColumnCollapsed, resetLayout } =
    useViewPrefs(storageKey);
  const { data: columns = [] } = useColumns();
  const canManageColumns = useCanManageColumns();
  const reorderColumns = useReorderColumns();
  const [managingColumn, setManagingColumn] = useState<BoardColumn | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  // Held above this screen so the assistant can drive the same filters.
  const { filters, patchFilters, clearFilters } = useTaskFilters();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogColumnId, setDialogColumnId] = useState<string | undefined>(undefined);

  const activeFilters: TaskFilters = {
    ...filters,
    search: debouncedSearch || undefined,
    projectId,
  };
  const { data: tasks, isPending, isError, error, refetch } = useTasks(activeFilters);

  const openAddTask = (columnId?: string) => {
    setDialogColumnId(columnId);
    setDialogOpen(true);
  };

  const hasActiveCriteria = Boolean(
    debouncedSearch || Object.values(filters).some(Boolean),
  );

  const renderBody = () => {
    if (isPending || !hydrated) {
      return prefs.mode === "list" && hydrated ? <ListSkeleton /> : <BoardSkeleton />;
    }

    if (isError) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      return (
        <EmptyState
          icon={isOffline ? WifiOff : RotateCcw}
          title={isOffline ? "You're offline" : "Couldn't load tasks"}
          description={
            isOffline
              ? "Reconnect to the internet and we'll pick up where you left off."
              : error instanceof ApiError
                ? error.message
                : "Something went wrong reaching the server. Please try again."
          }
          action={
            <Button variant="outline" onClick={() => void refetch()} className="gap-1.5">
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </Button>
          }
        />
      );
    }

    if (tasks && tasks.length === 0) {
      return hasActiveCriteria ? (
        <EmptyState
          icon={SearchX}
          title="No matching tasks"
          description="No task matches your current search and filters. Try a different term or clear them."
          action={
            <Button
              variant="outline"
              onClick={() => {
                clearFilters();
                setSearch("");
              }}
            >
              Clear search &amp; filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={ListChecks}
          title={projectId ? "No tasks in this project yet" : "Your board is empty"}
          description={
            projectId
              ? "Add the first task to this project to start tracking progress."
              : "Create your first task, then drag it between columns as work moves forward."
          }
          action={
            <Button onClick={() => openAddTask()} className="gap-1.5">
              <Plus className="size-4" aria-hidden />
              Add your first task
            </Button>
          }
        />
      );
    }

    return prefs.mode === "list" ? (
      <ListView
        tasks={tasks ?? []}
        columns={columns}
        fields={prefs.fields}
        onAddTask={openAddTask}
      />
    ) : (
      <BoardView
        tasks={tasks ?? []}
        columns={columns}
        fields={prefs.fields}
        collapsedColumns={prefs.collapsedColumns}
        canReorder={canManageColumns}
        onAddTask={openAddTask}
        onColumnOrderChange={(columnIds) => reorderColumns.mutate(columnIds)}
        onToggleCollapsed={toggleColumnCollapsed}
        onManageColumn={canManageColumns ? setManagingColumn : undefined}
        onAddColumn={canManageColumns ? () => setAddingColumn(true) : undefined}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar stays put; only the board/list below it scrolls. */}
      <div className="shrink-0">
        <ViewHeader
          title={title}
          prefs={prefs}
          onModeChange={setMode}
          onToggleField={toggleField}
          onResetLayout={resetLayout}
          filters={filters}
          onFiltersChange={patchFilters}
          onClearFilters={clearFilters}
          search={search}
          onSearchChange={setSearch}
          onAddTask={() => openAddTask()}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{renderBody()}</div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultColumnId={dialogColumnId}
        projectId={projectId}
      />

      <ColumnFormDialog
        open={addingColumn || Boolean(managingColumn)}
        onOpenChange={(next) => {
          if (next) return;
          setAddingColumn(false);
          setManagingColumn(null);
        }}
        column={managingColumn}
        columns={columns}
      />
    </div>
  );
}
