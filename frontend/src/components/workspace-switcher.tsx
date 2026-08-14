"use client";

import { Check, ChevronsUpDown, Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/components/providers/workspace-provider";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateWorkspace } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

/** Sidebar control for seeing which workspace you're in and moving between them. */
export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, isLoading, switchWorkspace } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const createWorkspace = useCreateWorkspace();

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-md" />;
  }

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createWorkspace.mutate(
      { name: trimmed },
      {
        onSuccess: (workspace) => {
          switchWorkspace(workspace.id);
          setCreating(false);
          setName("");
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="gap-2" data-tour="workspace-switcher">
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 truncate text-left text-sm font-medium">
              {activeWorkspace?.name ?? "No workspace"}
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className="gap-2"
              onSelect={() => switchWorkspace(workspace.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{workspace.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {workspace.role.toLowerCase()} ·{" "}
                  {workspace.memberCount === 1
                    ? "1 member"
                    : `${workspace.memberCount} members`}
                </span>
              </span>
              {workspace.id === activeWorkspace?.id ? (
                <Check className="size-4 shrink-0" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onSelect={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>
              A fresh board of its own. You&apos;ll be its owner, and can invite people
              once it exists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              autoFocus
              value={name}
              placeholder="Design Team"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreating(false)}
              disabled={createWorkspace.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={createWorkspace.isPending || !name.trim()}
              className={cn("gap-1.5")}
            >
              {createWorkspace.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {createWorkspace.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
