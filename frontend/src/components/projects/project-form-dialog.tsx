"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DatePicker } from "@/components/tasks/date-picker";
import { PriorityPicker } from "@/components/tasks/pickers";
import { PriorityIcon } from "@/components/tasks/priority-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useCreateProject, useMembers, useUpdateProject } from "@/hooks/use-api";
import { PRIORITY_META, type Project } from "@/lib/types";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Keep it under 200 characters"),
  priority: z.enum(["NO_PRIORITY", "URGENT", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.string().nullable(),
  leadId: z.string().nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: ProjectFormDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: members = [] } = useMembers();
  const isEdit = Boolean(project);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", priority: "NO_PRIORITY", dueDate: null, leadId: null },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      project
        ? {
            name: project.name,
            priority: project.priority,
            dueDate: project.dueDate
              ? format(new Date(project.dueDate), "yyyy-MM-dd")
              : null,
            leadId: project.leadId,
          }
        : { name: "", priority: "NO_PRIORITY", dueDate: null, leadId: null },
    );
  }, [open, project, form]);

  const submitting = createProject.isPending || updateProject.isPending;
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const save = async () => {
    const values = form.getValues();
    const payload = {
      name: values.name,
      priority: values.priority,
      dueDate: values.dueDate ?? undefined,
      leadId: values.leadId ?? undefined,
    };
    if (project) {
      await updateProject.mutateAsync({ id: project.id, input: payload });
    } else {
      await createProject.mutateAsync(payload);
    }
    setConfirmingSave(false);
    onOpenChange(false);
  };

  // Editing overwrites an existing project, so confirm first; creating saves
  // straight away.
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project details."
              : "Group related tasks under a project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Design Homepage" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
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
                name="leadId"
                render={({ field }) => {
                  const lead = members.find((m) => m.id === field.value);
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                        >
                          {lead ? (
                            <UserAvatar
                              name={lead.name}
                              avatarUrl={lead.avatarUrl}
                              className="size-5"
                            />
                          ) : (
                            <User className="size-3.5" aria-hidden />
                          )}
                          {lead?.name ?? "Lead"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="max-h-72 w-52 overflow-y-auto rounded-xl p-1.5"
                      >
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Project lead
                        </DropdownMenuLabel>
                        {members.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            className="gap-2"
                            onClick={() =>
                              field.onChange(field.value === member.id ? null : member.id)
                            }
                          >
                            <UserAvatar
                              name={member.name}
                              avatarUrl={member.avatarUrl}
                              className="size-5"
                            />
                            {member.name}
                            {field.value === member.id ? (
                              <Check className="ml-auto size-4" aria-hidden />
                            ) : null}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }}
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
                {isEdit ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <ConfirmDialog
        open={confirmingSave}
        onOpenChange={setConfirmingSave}
        title="Save changes to this project?"
        description="This overwrites the project's current details."
        confirmLabel="Save changes"
        pendingLabel="Saving…"
        pending={submitting}
        onConfirm={() => void save()}
      />

      <ConfirmDialog
        open={confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title="Discard your changes?"
        description="You have unsaved edits on this project. Closing now loses them."
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
