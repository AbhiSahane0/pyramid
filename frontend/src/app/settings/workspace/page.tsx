"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWorkspace } from "@/components/providers/workspace-context";
import { TypeToConfirmDialog } from "@/components/type-to-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteWorkspace,
  useProjects,
  useRenameWorkspace,
  useTasks,
  useWorkspaceMembers,
} from "@/hooks/use-api";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(60),
});

type Values = z.infer<typeof schema>;

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { activeWorkspace, workspaces, isLoading } = useWorkspace();
  const rename = useRenameWorkspace();
  const remove = useDeleteWorkspace();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Only to tell the owner what the delete actually costs.
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useWorkspaceMembers();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (activeWorkspace) form.reset({ name: activeWorkspace.name });
  }, [activeWorkspace, form]);

  if (isLoading || !activeWorkspace) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const isOwner = activeWorkspace.role === "OWNER";
  const isLast = workspaces.length <= 1;

  const counts = [
    `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`,
    `${projects.length} ${projects.length === 1 ? "project" : "projects"}`,
    `${members.length} ${members.length === 1 ? "member" : "members"}`,
  ].join(", ");

  const onSubmit = form.handleSubmit((values) => {
    if (values.name.trim() === activeWorkspace.name) return;
    rename.mutate({ name: values.name.trim() });
  });

  return (
    <div className="space-y-10">
      <section aria-label="Workspace">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Workspace</h1>

        <Form {...form}>
          <form onSubmit={onSubmit} className="rounded-xl border bg-card">
            <SettingRow
              label="Name"
              hint={
                isOwner
                  ? "Everyone in the workspace sees this name"
                  : "Only an owner can rename the workspace"
              }
            >
              <div className="flex w-full items-start gap-2 sm:w-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-60">
                      <FormControl>
                        <Input
                          placeholder="Untitled Workspace"
                          disabled={!isOwner}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!isOwner || rename.isPending}
                  className="gap-1.5"
                >
                  {rename.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Save
                </Button>
              </div>
            </SettingRow>

            <SettingRow label="Your role">
              <span className="text-sm text-muted-foreground capitalize">
                {activeWorkspace.role.toLowerCase()}
              </span>
            </SettingRow>

            <SettingRow label="Contents" hint="What this workspace holds today">
              <span className="text-sm text-muted-foreground">{counts}</span>
            </SettingRow>
          </form>
        </Form>
      </section>

      {isOwner ? (
        <section aria-label="Danger zone">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Danger zone</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete this workspace</p>
              <p className="text-sm text-muted-foreground">
                {isLast
                  ? "This is your only workspace. Create another one first — you need somewhere to work."
                  : "Its tasks, projects, labels and invitations go with it, for everyone."}
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isLast}
              className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete workspace
            </Button>
          </div>
        </section>
      ) : null}

      <TypeToConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this workspace?"
        description={`${counts} will be permanently deleted for everyone in it. This cannot be undone.`}
        confirmationText={activeWorkspace.name}
        prompt="Type the workspace name to confirm:"
        confirmLabel="Delete workspace"
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmingDelete(false);
              router.push("/tasks");
            },
          })
        }
      />
    </div>
  );
}
