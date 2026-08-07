"use client";

import { format } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { MemberAvatars } from "@/components/tasks/member-avatars";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TaskActionsMenu } from "@/components/tasks/task-actions-menu";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
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
import type { Task } from "@/lib/types";

interface SubtasksTableProps {
  parentId: string;
  subtasks: Task[];
}

export function SubtasksTable({ parentId, subtasks }: SubtasksTableProps) {
  const [adding, setAdding] = useState(false);

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden
        />
        Subtasks
        {subtasks.length > 0 ? (
          <span className="font-normal text-muted-foreground">{subtasks.length}</span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            {subtasks.length > 0 ? (
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-40 pl-4">Task</TableHead>
                  <TableHead className="w-28">Priority</TableHead>
                  <TableHead className="w-24">Members</TableHead>
                  <TableHead className="w-32">Due Date</TableHead>
                  <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            ) : null}
            <TableBody>
              {subtasks.map((subtask) => (
                <TableRow key={subtask.id}>
                  <TableCell className="pl-4 font-medium">{subtask.title}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={subtask.priority} />
                  </TableCell>
                  <TableCell>
                    <MemberAvatars members={subtask.members} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {subtask.dueDate
                      ? format(new Date(subtask.dueDate), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <TaskActionsMenu task={subtask} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add Subtasks
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>

      <TaskFormDialog open={adding} onOpenChange={setAdding} parentId={parentId} />
    </Collapsible>
  );
}
