"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { UserAvatar } from "@/components/user-avatar";
import { useLeaveWorkspace, useMe, useUpdateProfile } from "@/hooks/use-api";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  title: z.string().max(100),
  username: z
    .string()
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]*$/, "Letters, numbers, dots, dashes and underscores only"),
});

type ProfileValues = z.infer<typeof profileSchema>;

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

export default function ProfileSettingsPage() {
  const { data: user, isPending } = useMe();
  const updateProfile = useUpdateProfile();
  const leaveWorkspace = useLeaveWorkspace();
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", title: "", username: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        title: user.title ?? "",
        username: user.username ?? "",
      });
    }
  }, [user, form]);

  // Editing overwrites saved details, so the submit button opens a confirm and
  // the actual request runs from there.
  const onSubmit = form.handleSubmit(() => setConfirmingSave(true));

  const submitProfile = () => {
    updateProfile.mutate(form.getValues(), {
      onSuccess: (updated) => {
        form.reset({
          name: updated.name,
          title: updated.title ?? "",
          username: updated.username ?? "",
        });
        setConfirmingSave(false);
      },
    });
  };

  if (isPending || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-label="Profile">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Profile</h1>

        <Form {...form}>
          <form onSubmit={onSubmit} className="rounded-xl border bg-card">
            <SettingRow label="Profile picture">
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                className="size-10"
              />
            </SettingRow>

            <SettingRow label="Email">
              <span className="flex items-center gap-2 text-sm">
                {user.email}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Email is managed by your sign-in provider"
                  className="size-7 rounded-full text-muted-foreground"
                  onClick={() =>
                    toast.info(
                      user.isGuest
                        ? "Guest emails are generated automatically."
                        : "Your email comes from your Google account.",
                    )
                  }
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
              </span>
            </SettingRow>

            <SettingRow label="Full name">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-52">
                    <FormControl>
                      <Input placeholder="Dexter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingRow>

            <SettingRow label="Title" hint="Your job title or role">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-52">
                    <FormControl>
                      <Input placeholder="Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingRow>

            <SettingRow label="Username" hint="One word, like a nickname or first name">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-52">
                    <FormControl>
                      <Input placeholder="Dexuser" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingRow>

            {form.formState.isDirty ? (
              <div className="flex justify-end gap-2 px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset()}
                  disabled={updateProfile.isPending}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="gap-1.5"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {updateProfile.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
      </section>

      <section aria-label="Workspace access">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Workspace access</h2>
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Remove yourself from the workspace
          </p>
          <Button
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
            onClick={() => setConfirmingLeave(true)}
          >
            Leave Workspace
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmingLeave}
        onOpenChange={setConfirmingLeave}
        title="Leave this workspace?"
        description="Your account and every project, task and comment you own will be permanently deleted. This cannot be undone."
        confirmLabel="Leave Workspace"
        pendingLabel="Leaving…"
        destructive
        pending={leaveWorkspace.isPending}
        onConfirm={() => leaveWorkspace.mutate()}
      />

      <ConfirmDialog
        open={confirmingSave}
        onOpenChange={setConfirmingSave}
        title="Save profile changes?"
        description="This overwrites your current profile details."
        confirmLabel="Save changes"
        pendingLabel="Saving…"
        pending={updateProfile.isPending}
        onConfirm={submitProfile}
      />
    </div>
  );
}
