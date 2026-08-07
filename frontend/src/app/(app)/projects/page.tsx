"use client";

import { format } from "date-fns";
import {
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { MemberAvatars } from "@/components/tasks/member-avatars";
import { PriorityBadge } from "@/components/tasks/priority-badge";
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
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
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

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        {isPending ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">Couldn&apos;t load projects.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RotateCcw className="size-4" aria-hidden />
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderKanban className="size-8 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">
                {search ? "No matching projects" : "No projects yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search."
                  : "Create a project to group related tasks."}
              </p>
            </div>
            {!search ? (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Add Project
              </Button>
            ) : null}
          </div>
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
                    <TableCell className="pl-4 font-medium">{project.name}</TableCell>
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
                      {project.dueDate ? format(new Date(project.dueDate), "dd MMM yyyy") : "—"}
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
                        <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
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

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; and all of its tasks will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteProject.mutate(deleting.id);
                setDeleting(undefined);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
