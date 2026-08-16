"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Tag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/tasks/date-picker";
import {
  LabelPicker,
  MemberPicker,
  PriorityPicker,
  StatusDot,
  StatusPicker,
} from "@/components/tasks/pickers";
import { PriorityIcon } from "@/components/tasks/priority-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useColumns, useCreateTask, useUpdateTask } from "@/hooks/use-api";
import { PRIORITY_META, type Task } from "@/lib/types";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Keep it under 300 characters"),
  description: z.string().max(5000, "Keep it under 5000 characters").optional(),
  columnId: z.string().min(1, "Pick a column"),
  priority: z.enum(["NO_PRIORITY", "URGENT", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.string().nullable(),
  memberIds: z.array(z.string()),
  labelIds: z.array(z.string()),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing task switches the dialog to edit mode. */
  task?: Task;
  /** Presets for creation (column "+", project view, subtasks). */
  defaultColumnId?: string;
  projectId?: string;
  parentId?: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultColumnId,
  projectId,
  parentId,
}: TaskFormDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: columns = [] } = useColumns();
  const isEdit = Boolean(task);
  // Whatever the caller asked for, falling back to the leftmost column.
  const fallbackColumnId = defaultColumnId ?? columns[0]?.id ?? "";

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      columnId: fallbackColumnId,
      priority: "NO_PRIORITY",
      dueDate: null,
      memberIds: [],
      labelIds: [],
    },
  });

  // Re-sync form contents whenever the dialog opens for a different target.
  useEffect(() => {
    if (!open) return;
    form.reset(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            columnId: task.columnId,
            priority: task.priority,
            dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null,
            memberIds: task.members.map((m) => m.id),
            labelIds: task.labels.map((l) => l.id),
          }
        : {
            title: "",
            description: "",
            columnId: fallbackColumnId,
            priority: "NO_PRIORITY",
            dueDate: null,
            memberIds: [],
            labelIds: [],
          },
    );
  }, [open, task, fallbackColumnId, form]);

  const submitting = createTask.isPending || updateTask.isPending;
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const save = async () => {
    const values = form.getValues();
    const payload = {
      title: values.title,
      description: values.description || undefined,
      columnId: values.columnId,
      priority: values.priority,
      dueDate: values.dueDate ?? undefined,
      memberIds: values.memberIds,
      labelIds: values.labelIds,
    };
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        input: { ...payload, dueDate: values.dueDate },
      });
    } else {
      await createTask.mutateAsync({ ...payload, projectId, parentId });
    }
    setConfirmingSave(false);
    onOpenChange(false);
  };

  // Editing overwrites an existing task, so confirm first. Creating has
  // nothing to overwrite and saves straight away.
  const onSubmit = form.handleSubmit(async () => {
    if (isEdit) setConfirmingSave(true);
    else await save();
  });

  /** Closing with unsaved edits asks before throwing them away. */
  const requestClose = (next: boolean) => {
    if (!next && form.formState.isDirty && !submitting) {
      setConfirmingDiscard(true);
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit task" : parentId ? "Add subtask" : "Add task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this task."
              : "Fill in the details — you can refine everything later."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Write API Documentation"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more context…"
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
              <FormField
                control={form.control}
                name="columnId"
                render={({ field }) => (
                  <StatusPicker
                    value={field.value}
                    onChange={field.onChange}
                    columns={columns}
                    align="start"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                      >
                        <StatusDot
                          color={
                            columns.find((column) => column.id === field.value)?.color ??
                            "slate"
                          }
                        />
                        {columns.find((column) => column.id === field.value)?.name ??
                          "Column"}
                      </Button>
                    }
                  />
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <PriorityPicker
                    value={field.value}
                    onChange={field.onChange}
                    align="start"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                      >
                        <PriorityIcon priority={field.value} />
                        {PRIORITY_META[field.value].label}
                      </Button>
                    }
                  />
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                      >
                        <CalendarIcon className="size-3.5" aria-hidden />
                        {field.value
                          ? format(new Date(field.value), "MMM d, yyyy")
                          : "Due date"}
                      </Button>
                    }
                  />
                )}
              />
              <FormField
                control={form.control}
                name="memberIds"
                render={({ field }) => (
                  <MemberPicker
                    value={field.value}
                    onChange={field.onChange}
                    align="start"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                      >
                        <Users className="size-3.5" aria-hidden />
                        {field.value.length > 0
                          ? `${field.value.length} member${field.value.length > 1 ? "s" : ""}`
                          : "Members"}
                      </Button>
                    }
                  />
                )}
              />
              <FormField
                control={form.control}
                name="labelIds"
                render={({ field }) => (
                  <LabelPicker
                    value={field.value}
                    onChange={field.onChange}
                    align="start"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                      >
                        <Tag className="size-3.5" aria-hidden />
                        {field.value.length > 0
                          ? `${field.value.length} label${field.value.length > 1 ? "s" : ""}`
                          : "Labels"}
                      </Button>
                    }
                  />
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <ConfirmDialog
        open={confirmingSave}
        onOpenChange={setConfirmingSave}
        title="Save changes to this task?"
        description="This overwrites the task's current details."
        confirmLabel="Save changes"
        pendingLabel="Saving…"
        pending={submitting}
        onConfirm={() => void save()}
      />

      <ConfirmDialog
        open={confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title="Discard your changes?"
        description="You have unsaved edits on this task. Closing now loses them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setConfirmingDiscard(false);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
