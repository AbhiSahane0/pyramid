"use client";

import { format } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ViewPrefs } from "@/hooks/use-view-prefs";
import { STATUS_META, STATUS_ORDER, type Task, type TaskStatus } from "@/lib/types";
import { LabelBadge } from "./label-badge";
import { MemberAvatars } from "./member-avatars";
import { PriorityBadge } from "./priority-badge";
import { StatusDot } from "./pickers";
import { TaskActionsMenu } from "./task-actions-menu";

interface ListViewProps {
  tasks: Task[];
  fields: ViewPrefs["fields"];
  onAddTask: (status: TaskStatus) => void;
}

/** Grouped-by-status tables matching the design's list layout. */
export function ListView({ tasks, fields, onAddTask }: ListViewProps) {
  const router = useRouter();

  const visibleColumns = [
    fields.priority,
    fields.members,
    fields.dueDate,
    fields.labels,
    fields.status,
    fields.reporter,
  ].filter(Boolean).length;

  const groups = STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position),
  })).filter((group) => group.tasks.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-8 sm:px-6">
      {groups.map(({ status, tasks: groupTasks }) => (
        <Collapsible key={status} defaultOpen>
          <CollapsibleTrigger className="group mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <ChevronDown
              className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
              aria-hidden
            />
            {STATUS_META[status].label}
            <span className="font-normal text-muted-foreground">{groupTasks.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-56 pl-4">Task</TableHead>
                    {fields.priority ? (
                      <TableHead className="w-32">Priority</TableHead>
                    ) : null}
                    {fields.members ? (
                      <TableHead className="w-28">Members</TableHead>
                    ) : null}
                    {fields.dueDate ? (
                      <TableHead className="w-36">Due Date</TableHead>
                    ) : null}
                    {fields.labels ? (
                      <TableHead className="w-44">Labels</TableHead>
                    ) : null}
                    {fields.status ? (
                      <TableHead className="w-32">Status</TableHead>
                    ) : null}
                    {fields.reporter ? (
                      <TableHead className="w-32">Reporter</TableHead>
                    ) : null}
                    <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <TableCell className="pl-4 font-medium">{task.title}</TableCell>
                      {fields.priority ? (
                        <TableCell>
                          <PriorityBadge priority={task.priority} className="text-sm" />
                        </TableCell>
                      ) : null}
                      {fields.members ? (
                        <TableCell>
                          <MemberAvatars
                            members={task.members}
                            onAdd={() => router.push(`/tasks/${task.id}`)}
                          />
                        </TableCell>
                      ) : null}
                      {fields.dueDate ? (
                        <TableCell className="text-sm">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "dd MMM yyyy")
                            : "—"}
                        </TableCell>
                      ) : null}
                      {fields.labels ? (
                        <TableCell>
                          <span className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 2).map((label) => (
                              <LabelBadge key={label.id} label={label} />
                            ))}
                            {task.labels.length > 2 ? (
                              <span className="self-center text-xs text-muted-foreground">
                                +{task.labels.length - 2}
                              </span>
                            ) : null}
                          </span>
                        </TableCell>
                      ) : null}
                      {fields.status ? (
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm">
                            <StatusDot status={task.status} />
                            {STATUS_META[task.status].label}
                          </span>
                        </TableCell>
                      ) : null}
                      {fields.reporter ? (
                        <TableCell className="text-sm text-muted-foreground">
                          {task.reporter?.name ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="pr-4 text-right">
                        <TaskActionsMenu task={task} />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={visibleColumns + 2} className="p-0">
                      <button
                        type="button"
                        onClick={() => onAddTask(status)}
                        className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Plus className="size-4" aria-hidden />
                        Add Task
                      </button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
