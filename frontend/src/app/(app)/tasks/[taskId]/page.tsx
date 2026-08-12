"use client";

import {
  Eye,
  Link2,
  Loader2,
  Lock,
  Paperclip,
  PanelRight,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DueDateChip } from "@/components/tasks/due-date-chip";
import { LabelBadge } from "@/components/tasks/label-badge";
import { LabelPicker } from "@/components/tasks/pickers";
import { CommentsSection } from "@/components/tasks/detail/comments-section";
import { DetailsSidebar } from "@/components/tasks/detail/details-sidebar";
import { SubtasksTable } from "@/components/tasks/detail/subtasks-table";
import { TaskActionsMenu } from "@/components/tasks/task-actions-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import {
  useAddResource,
  useDeleteResource,
  useTask,
  useUpdateTask,
} from "@/hooks/use-api";
import { ApiError } from "@/lib/api";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="w-full space-y-4 lg:w-80">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

function AddResourceDialog({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addResource = useAddResource(taskId);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) return;
    await addResource.mutateAsync({ name: name.trim(), url: url.trim() });
    setName("");
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add resource</DialogTitle>
          <DialogDescription>Attach a document or link to this task.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            placeholder="Name — e.g. API design doc"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <Input
            placeholder="https://…"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addResource.isPending || !name.trim() || !url.trim()}
              className="gap-1.5"
            >
              {addResource.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {addResource.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const { data: task, isPending, isError, error, refetch } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteResource = useDeleteResource(taskId);

  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  if (isPending) return <DetailSkeleton />;

  if (isError || !task) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-medium">
          {notFound ? "Task not found" : "Couldn't load this task"}
        </p>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? "It may have been deleted or belongs to another workspace."
            : "Check your connection and try again."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/tasks")}>
            Back to tasks
          </Button>
          {!notFound ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RotateCcw className="size-4" aria-hidden />
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const saveTitle = () => {
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (title && title !== task.title) {
      updateTask.mutate({ id: task.id, input: { title } });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              {editingTitle ? (
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveTitle();
                    if (event.key === "Escape") setEditingTitle(false);
                  }}
                  className="h-10 max-w-xl text-2xl font-bold"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(task.title);
                    setEditingTitle(true);
                  }}
                  className="text-left text-2xl font-bold tracking-tight hover:opacity-80 sm:text-3xl"
                  aria-label="Edit title"
                >
                  {task.title}
                </button>
              )}

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Private task"
                  className="size-8 text-muted-foreground"
                >
                  <Lock className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  aria-label="Watchers"
                  className="h-8 gap-1 px-2 text-muted-foreground"
                >
                  <Eye className="size-4" aria-hidden />
                  <span className="text-xs font-medium">1</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy link"
                  className="size-8 text-muted-foreground"
                  onClick={() => {
                    void navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  <Link2 className="size-4" aria-hidden />
                </Button>
                <TaskActionsMenu
                  task={task}
                  onDeleted={() => router.push("/tasks")}
                  className="size-8 rounded-md border border-input bg-background text-muted-foreground shadow-xs hover:bg-accent"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Toggle details panel"
                  className="size-8 text-muted-foreground"
                  onClick={() => setShowSidebar((current) => !current)}
                >
                  <PanelRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            {task.description ? (
              <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            ) : null}
          </div>

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center gap-4">
              <dt className="w-24 shrink-0 font-semibold">Properties</dt>
              <dd className="flex flex-wrap items-center gap-2">
                {task.reporter ? (
                  <span className="flex items-center gap-1.5 font-medium">
                    <UserAvatar
                      name={task.reporter.name}
                      avatarUrl={task.reporter.avatarUrl}
                      className="size-5"
                    />
                    {task.reporter.name}
                  </span>
                ) : null}
                {task.dueDate ? <DueDateChip date={task.dueDate} /> : null}
              </dd>
            </div>

            <div className="flex items-center gap-4">
              <dt className="w-24 shrink-0 font-semibold">Labels</dt>
              <dd className="flex flex-wrap items-center gap-1.5">
                {task.labels.map((label) => (
                  <LabelBadge key={label.id} label={label} />
                ))}
                <LabelPicker
                  value={task.labels.map((l) => l.id)}
                  onChange={(labelIds) =>
                    updateTask.mutate({ id: task.id, input: { labelIds } })
                  }
                  align="start"
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit labels"
                      className="size-6 text-muted-foreground"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                  }
                />
              </dd>
            </div>

            <div className="flex items-center gap-4">
              <dt className="w-24 shrink-0 font-semibold">Resources</dt>
              <dd className="flex flex-wrap items-center gap-2">
                {task.resources.map((resource) => (
                  <span
                    key={resource.id}
                    className="group flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {resource.name}
                    </a>
                    <button
                      type="button"
                      aria-label={`Remove ${resource.name}`}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={() => deleteResource.mutate(resource.id)}
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 font-normal text-muted-foreground"
                  onClick={() => setResourceDialogOpen(true)}
                >
                  <Paperclip className="size-3.5" aria-hidden />
                  Add document or link…
                </Button>
              </dd>
            </div>
          </dl>

          <SubtasksTable parentId={task.id} subtasks={task.subtasks} />

          <CommentsSection taskId={task.id} comments={task.comments} />
        </div>

        {showSidebar ? <DetailsSidebar task={task} /> : null}
      </div>

      <AddResourceDialog
        taskId={task.id}
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
      />
    </div>
  );
}
