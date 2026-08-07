"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  ChevronDown,
  Plus,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import {
  DatePicker,
} from "@/components/tasks/date-picker";
import {
  LabelPicker,
  MemberPicker,
  PriorityPicker,
  StatusDot,
  StatusPicker,
} from "@/components/tasks/pickers";
import { PriorityIcon } from "@/components/tasks/priority-badge";
import { MemberAvatars } from "@/components/tasks/member-avatars";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { useMe, useMembers, useUpdateTask } from "@/hooks/use-api";
import {
  PRIORITY_META,
  STATUS_META,
  type Activity,
  type TaskDetail,
} from "@/lib/types";

function activityText(activity: Activity): string {
  switch (activity.type) {
    case "priority_changed":
      return `changed priority from ${activity.meta?.from ?? "?"} to ${activity.meta?.to ?? "?"}`;
    case "status_changed":
      return `changed status from ${activity.meta?.from ?? "?"} to ${activity.meta?.to ?? "?"}`;
    case "update_posted":
      return "posted an update";
    default:
      return activity.type.replaceAll("_", " ");
  }
}

/** The right rail: editable Details card + Updates activity feed. */
export function DetailsSidebar({ task }: { task: TaskDetail }) {
  const updateTask = useUpdateTask();
  const { data: me } = useMe();
  const { data: members = [] } = useMembers();

  const patch = (input: Parameters<typeof updateTask.mutate>[0]["input"]) => {
    updateTask.mutate({ id: task.id, input });
  };

  return (
    <div className="flex w-full flex-col gap-4 lg:w-80">
      <Collapsible defaultOpen className="rounded-xl border bg-card">
        <div className="flex items-center gap-1 px-4 py-3">
          <CollapsibleTrigger className="group flex items-center gap-1.5 text-sm font-semibold">
            <ChevronDown
              className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
              aria-hidden
            />
            Details
          </CollapsibleTrigger>
          <span className="flex-1" />
          <Button variant="ghost" size="icon" aria-label="Add field" className="size-6 text-muted-foreground">
            <Plus className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Details settings" className="size-6 text-muted-foreground">
            <Settings2 className="size-4" aria-hidden />
          </Button>
        </div>
        <CollapsibleContent>
          <dl className="space-y-1 px-4 pb-4 text-sm">
            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Status</dt>
              <dd>
                <StatusPicker
                  value={task.status}
                  onChange={(status) => patch({ status })}
                  align="start"
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-medium">
                      <StatusDot status={task.status} />
                      {STATUS_META[task.status].label}
                    </Button>
                  }
                />
              </dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Priority</dt>
              <dd>
                <PriorityPicker
                  value={task.priority}
                  onChange={(priority) => patch({ priority })}
                  align="start"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 gap-1.5 px-2 font-medium ${PRIORITY_META[task.priority].textClass}`}
                    >
                      <PriorityIcon priority={task.priority} />
                      {PRIORITY_META[task.priority].label}
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  }
                />
              </dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Members</dt>
              <dd>
                <MemberPicker
                  value={task.members.map((m) => m.id)}
                  onChange={(memberIds) => patch({ memberIds })}
                  align="start"
                  trigger={
                    task.members.length > 0 ? (
                      <button type="button" aria-label="Edit members">
                        <MemberAvatars members={task.members} max={4} />
                      </button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-medium text-muted-foreground">
                        <Users className="size-4" aria-hidden />
                        Add members
                      </Button>
                    )
                  }
                />
              </dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Dates</dt>
              <dd className="flex items-center gap-1.5">
                <DatePicker
                  value={task.startDate}
                  onChange={(startDate) => patch({ startDate })}
                  placeholder="Start"
                />
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                <DatePicker
                  value={task.dueDate}
                  onChange={(dueDate) => patch({ dueDate })}
                  placeholder="End"
                />
              </dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Labels</dt>
              <dd>
                <LabelPicker
                  value={task.labels.map((l) => l.id)}
                  onChange={(labelIds) => patch({ labelIds })}
                  align="start"
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-medium text-muted-foreground">
                      {task.labels.length > 0
                        ? `${task.labels.length} label${task.labels.length > 1 ? "s" : ""}`
                        : "Add labels"}
                    </Button>
                  }
                />
              </dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Teams</dt>
              <dd className="px-2 text-muted-foreground">—</dd>
            </div>

            <div className="flex min-h-8 items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Reporter</dt>
              <dd>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-medium">
                      {task.reporter ? (
                        <>
                          <UserAvatar
                            name={task.reporter.name}
                            avatarUrl={task.reporter.avatarUrl}
                            className="size-5"
                          />
                          {task.reporter.name}
                        </>
                      ) : (
                        <>
                          <UserRound className="size-4 text-muted-foreground" aria-hidden />
                          <span className="text-muted-foreground">Set reporter</span>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto rounded-xl p-1.5">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      Reporter
                    </DropdownMenuLabel>
                    {members.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        className="gap-2"
                        onClick={() => patch({ reporterId: member.id })}
                      >
                        <UserAvatar name={member.name} avatarUrl={member.avatarUrl} className="size-5" />
                        {member.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </dd>
            </div>
          </dl>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen className="rounded-xl border bg-card">
        <CollapsibleTrigger className="group flex w-full items-center gap-1.5 px-4 py-3 text-sm font-semibold">
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
            aria-hidden
          />
          Updates
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-3 px-4 pb-4">
            {task.activities.length === 0 ? (
              <li className="text-sm text-muted-foreground">No updates yet.</li>
            ) : (
              task.activities.map((activity) => {
                const isMe = activity.actorId === me?.id;
                const actorName = isMe ? "You" : (activity.actor?.name ?? "Someone");
                return (
                  <li key={activity.id} className="flex items-start gap-2.5">
                    {activity.type === "priority_changed" ? (
                      <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-muted">
                        <PriorityIcon priority="URGENT" />
                      </span>
                    ) : (
                      <UserAvatar
                        name={activity.actor?.name ?? "?"}
                        avatarUrl={activity.actor?.avatarUrl}
                        className="mt-0.5 size-6"
                      />
                    )}
                    <p className="min-w-0 text-sm leading-snug">
                      <span className="font-semibold">{actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {activityText(activity)} ·{" "}
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
