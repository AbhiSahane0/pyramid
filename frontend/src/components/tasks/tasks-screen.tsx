"use client";

import { ClipboardList, RotateCcw, SearchX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { useViewPrefs } from "@/hooks/use-view-prefs";
import type { TaskFilters, TaskStatus } from "@/lib/types";
import { BoardView } from "./board-view";
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
    <div className="flex flex-1 gap-4 overflow-hidden px-4 sm:px-6">
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
    <div className="flex flex-col gap-6 px-4 sm:px-6">
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
  const { prefs, hydrated, setMode, toggleField } = useViewPrefs(storageKey);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("TODO");

  const activeFilters: TaskFilters = {
    ...filters,
    search: debouncedSearch || undefined,
    projectId,
  };
  const { data: tasks, isPending, isError, refetch } = useTasks(activeFilters);

  const openAddTask = (status: TaskStatus = "TODO") => {
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const hasActiveCriteria = Boolean(
    debouncedSearch || Object.values(filters).some(Boolean),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        title={title}
        prefs={prefs}
        onModeChange={setMode}
        onToggleField={toggleField}
        filters={filters}
        onFiltersChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        onAddTask={() => openAddTask()}
      />

      {isPending || !hydrated ? (
        prefs.mode === "list" && hydrated ? (
          <ListSkeleton />
        ) : (
          <BoardSkeleton />
        )
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load tasks. Check your connection and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" aria-hidden />
            Retry
          </Button>
        </div>
      ) : tasks && tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          {hasActiveCriteria ? (
            <>
              <SearchX className="size-8 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-medium">No matching tasks</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search or clear the filters.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({});
                  setSearch("");
                }}
              >
                Clear all
              </Button>
            </>
          ) : (
            <>
              <ClipboardList className="size-8 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first task to get things moving.
                </p>
              </div>
              <Button size="sm" onClick={() => openAddTask()}>
                Add Task
              </Button>
            </>
          )}
        </div>
      ) : prefs.mode === "list" ? (
        <ListView tasks={tasks ?? []} fields={prefs.fields} onAddTask={openAddTask} />
      ) : (
        <BoardView tasks={tasks ?? []} fields={prefs.fields} onAddTask={openAddTask} />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStatus={dialogStatus}
        projectId={projectId}
      />
    </div>
  );
}
