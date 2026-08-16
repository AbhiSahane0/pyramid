"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateColumn, useDeleteColumn, useUpdateColumn } from "@/hooks/use-api";
import {
  BOARD_COLORS,
  BOARD_COLOR_META,
  columnDotClass,
  type BoardColor,
  type BoardColumn,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColumnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null creates a new column; a column edits that one. */
  column: BoardColumn | null;
  columns: BoardColumn[];
}

/**
 * Create or edit a board column.
 *
 * Deleting one asks where its tasks should go rather than taking them with it:
 * a column is a label on work, and removing the label should not remove the
 * work. When it is empty there is nothing to ask.
 */
export function ColumnFormDialog({
  open,
  onOpenChange,
  column,
  columns,
}: ColumnFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {/* Keyed so switching between columns remounts with fresh fields —
            seeding from props in an effect would flash the previous values. */}
        {open ? (
          <ColumnForm
            key={column?.id ?? "new"}
            column={column}
            columns={columns}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ColumnForm({
  column,
  columns,
  onDone,
}: {
  column: BoardColumn | null;
  columns: BoardColumn[];
  onDone: () => void;
}) {
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();

  const others = columns.filter((candidate) => candidate.id !== column?.id);
  const taskCount = column?._count.tasks ?? 0;

  const [name, setName] = useState(column?.name ?? "");
  const [color, setColor] = useState<BoardColor>(column?.color ?? "slate");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moveTasksTo, setMoveTasksTo] = useState<string>(others[0]?.id ?? "");

  const pending =
    createColumn.isPending || updateColumn.isPending || deleteColumn.isPending;
  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !pending;

  const close = onDone;

  const save = () => {
    if (!canSave) return;
    if (column) {
      updateColumn.mutate(
        { id: column.id, input: { name: trimmed, color } },
        { onSuccess: close },
      );
    } else {
      createColumn.mutate({ name: trimmed, color }, { onSuccess: close });
    }
  };

  const remove = () => {
    if (!column) return;
    deleteColumn.mutate(
      {
        id: column.id,
        moveTasksTo: taskCount > 0 ? moveTasksTo : undefined,
      },
      { onSuccess: close },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{column ? "Edit column" : "New column"}</DialogTitle>
        <DialogDescription>
          {column
            ? "Everyone looking at this board sees the change."
            : "It is added to the end of the board. Drag its handle to move it."}
        </DialogDescription>
      </DialogHeader>

      {confirmingDelete ? (
        <div className="space-y-3">
          <p className="text-sm">
            {taskCount > 0
              ? `“${column?.name}” holds ${taskCount} ${
                  taskCount === 1 ? "task" : "tasks"
                }. Where should they go?`
              : `“${column?.name}” is empty and will be removed.`}
          </p>

          {taskCount > 0 ? (
            <Select value={moveTasksTo} onValueChange={setMoveTasksTo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a column" />
              </SelectTrigger>
              <SelectContent>
                {others.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          columnDotClass(candidate.color),
                        )}
                        aria-hidden
                      />
                      {candidate.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmingDelete(false)}
              disabled={pending}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              disabled={pending || (taskCount > 0 && !moveTasksTo)}
              onClick={remove}
            >
              {deleteColumn.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {taskCount > 0 ? "Move tasks and delete" : "Delete column"}
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Name</Label>
            <Input
              id="column-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Blocked"
              maxLength={30}
              autoFocus
              disabled={pending}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={BOARD_COLOR_META[option].label}
                  aria-pressed={color === option}
                  disabled={pending}
                  onClick={() => setColor(option)}
                  className={cn(
                    "size-7 rounded-full ring-offset-2 ring-offset-background transition",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    BOARD_COLOR_META[option].dotClass,
                    color === option && "ring-2 ring-foreground",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {column && columns.length > 1 ? (
              <Button
                variant="ghost"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave} className="gap-1.5">
                {createColumn.isPending || updateColumn.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {column ? "Save" : "Add column"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      )}
    </>
  );
}
