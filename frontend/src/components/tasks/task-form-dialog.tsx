"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Tag, Users } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
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
import { useCreateTask, useUpdateTask } from "@/hooks/use-api";
import { PRIORITY_META, STATUS_META, type Task, type TaskStatus } from "@/lib/types";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Keep it under 300 characters"),
  description: z.string().max(5000, "Keep it under 5000 characters").optional(),
  status: z.enum(["BACKLOG", "TODO", "DOING", "COMPLETED", "ON_HOLD"]),
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
  defaultStatus?: TaskStatus;
  projectId?: string;
  parentId?: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "TODO",
  projectId,
  parentId,
}: TaskFormDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = Boolean(task);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
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
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null,
            memberIds: task.members.map((m) => m.id),
            labelIds: task.labels.map((l) => l.id),
          }
        : {
            title: "",
            description: "",
            status: defaultStatus,
            priority: "NO_PRIORITY",
            dueDate: null,
            memberIds: [],
            labelIds: [],
          },
    );
  }, [open, task, defaultStatus, form]);

  const submitting = createTask.isPending || updateTask.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      status: values.status,
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
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                name="status"
                render={({ field }) => (
                  <StatusPicker
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
                        <StatusDot status={field.value} />
                        {STATUS_META[field.value].label}
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
    </Dialog>
  );
}
