"use client";

import { format } from "date-fns";
import {
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/tasks/empty-state";
import { MemberAvatars } from "@/components/tasks/member-avatars";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteProject, useProjects } from "@/hooks/use-api";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isPending, isError, refetch } = useProjects();
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [deleting, setDeleting] = useState<Project | undefined>(undefined);

  const filtered = (projects ?? []).filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight">Projects</h1>
        <div className="flex flex-1 items-center justify-end gap-2">
          {searchOpen ? (
            <div className="relative w-full max-w-xs">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearch("");
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search projects…"
                className="h-9 pl-8 pr-8"
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label="Search projects"
              className="size-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" aria-hidden />
            </Button>
          )}
          <Button
            className="h-9 gap-1.5 px-3.5 font-semibold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add Project
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8 sm:px-6">
        {isPending ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : isError ? (
          <EmptyState
            icon={RotateCcw}
            title="Couldn't load projects"
            description="Something went wrong reaching the server. Please try again."
            action={
              <Button
                variant="outline"
                onClick={() => void refetch()}
                className="gap-1.5"
              >
                <RotateCcw className="size-4" aria-hidden />
                Try again
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={search ? SearchX : FolderKanban}
            title={search ? "No matching projects" : "No projects yet"}
            description={
              search
                ? `Nothing matches \u201c${search}\u201d. Try a different name.`
                : "Projects group related tasks together \u2014 create one to organise your work."
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditing(undefined);
                    setDialogOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="size-4" aria-hidden />
                  Create your first project
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-56 pl-4">Projects</TableHead>
                  <TableHead className="w-32">Priority</TableHead>
                  <TableHead className="w-28">Lead</TableHead>
                  <TableHead className="w-36">Due Date</TableHead>
                  <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <TableCell className="max-w-0 pl-4 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="truncate" title={project.name}>
                          {project.name}
                        </span>
                        <span className="shrink-0 text-xs font-normal text-muted-foreground">
                          {project._count.tasks}{" "}
                          {project._count.tasks === 1 ? "task" : "tasks"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={project.priority} />
                    </TableCell>
                    <TableCell>
                      <MemberAvatars
                        members={project.lead ? [project.lead] : []}
                        onAdd={() => {
                          setEditing(project);
                          setDialogOpen(true);
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.dueDate
                        ? format(new Date(project.dueDate), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${project.name}`}
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 rounded-xl p-1.5"
                        >
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditing(project);
                              setDialogOpen(true);
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
                              setDeleting(project);
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(undefined);
                        setDialogOpen(true);
                      }}
                      className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Plus className="size-4" aria-hidden />
                      Add Projects
                    </button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this project?"
        // Naming the number is the difference between a warning people read
        // and one they click through: "and all of its tasks" hides how much
        // is about to go.
        description={
          deleting?._count.tasks
            ? `“${deleting.name}” and its ${deleting._count.tasks} ${
                deleting._count.tasks === 1 ? "task" : "tasks"
              } will be permanently deleted. This cannot be undone — move any task you want to keep to another project first.`
            : `“${deleting?.name ?? ""}” will be permanently deleted. It has no tasks.`
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        destructive
        pending={deleteProject.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteProject.mutate(deleting.id, {
            onSuccess: () => setDeleting(undefined),
          });
        }}
      />
    </div>
  );
}
