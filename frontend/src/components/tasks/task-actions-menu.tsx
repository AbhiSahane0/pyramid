"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTask } from "@/hooks/use-api";
import type { Task } from "@/lib/types";
import { TaskFormDialog } from "./task-form-dialog";

interface TaskActionsMenuProps {
  task: Task;
  /** Called after a successful delete, e.g. to navigate away from detail. */
  onDeleted?: () => void;
  className?: string;
}

/** The "…" menu on cards, list rows and the detail page. */
export function TaskActionsMenu({ task, onDeleted, className }: TaskActionsMenuProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTask = useDeleteTask();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${task.title}`}
            className={className ?? "size-7 text-muted-foreground hover:text-foreground"}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
          <DropdownMenuItem
            className="gap-2"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={(event) => {
              event.stopPropagation();
              setConfirmingDelete(true);
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskFormDialog open={editing} onOpenChange={setEditing} task={task} />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{task.title}&rdquo; and all of its subtasks and comments will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTask.mutate(task.id, { onSuccess: onDeleted })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
