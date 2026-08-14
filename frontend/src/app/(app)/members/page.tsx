"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  MoreHorizontal,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { EmptyState } from "@/components/tasks/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import { InviteDialog } from "@/components/workspace/invite-dialog";
import {
  useMe,
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useWorkspaceMembers,
} from "@/hooks/use-api";
import { hasAtLeast, type WorkspaceMember } from "@/lib/types";

function RoleBadge({ role }: { role: WorkspaceMember["role"] }) {
  if (role === "OWNER") {
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="size-3" aria-hidden />
        Owner
      </Badge>
    );
  }
  if (role === "ADMIN") return <Badge variant="secondary">Admin</Badge>;
  return <Badge variant="outline">Member</Badge>;
}

export default function MembersPage() {
  const { activeWorkspace } = useWorkspace();
  const { data: me } = useMe();
  const { data: members, isPending } = useWorkspaceMembers();

  const canManage = activeWorkspace ? hasAtLeast(activeWorkspace.role, "ADMIN") : false;
  const { data: invitations } = useWorkspaceInvitations(canManage);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();

  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar stays put; only the lists below scroll. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">Members</h1>
          <p className="truncate text-sm text-muted-foreground">
            People with access to {activeWorkspace?.name ?? "this workspace"}
          </p>
        </div>
        {canManage ? (
          <Button className="h-9 gap-1.5" onClick={() => setInviting(true)}>
            <UserPlus className="size-4" aria-hidden />
            Invite people
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground">View only</span>
            </TooltipTrigger>
            <TooltipContent>Only admins can invite or manage people</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-4 pb-8 sm:px-6">
        <section aria-label="Members">
          {isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {(members ?? []).map((member) => {
                const isSelf = member.id === me?.id;
                // The owner is immovable, and nobody manages themselves here.
                const actionable = canManage && !isSelf && member.role !== "OWNER";

                return (
                  <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      className="size-9 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                        {isSelf ? (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <RoleBadge role={member.role} />
                    {actionable ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            aria-label={`Manage ${member.name}`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-xl p-1.5"
                        >
                          <DropdownMenuItem
                            className="gap-2"
                            disabled={updateRole.isPending}
                            onSelect={() =>
                              updateRole.mutate({
                                userId: member.id,
                                role: member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                              })
                            }
                          >
                            <ShieldCheck className="size-4" aria-hidden />
                            {member.role === "ADMIN" ? "Make member" : "Make admin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="gap-2"
                            onSelect={() => setRemoving(member)}
                          >
                            <UserMinus className="size-4" aria-hidden />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="size-8" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {canManage ? (
          <section aria-label="Pending invitations">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              Pending invitations
            </h2>
            {invitations && invitations.length > 0 ? (
              <ul className="divide-y rounded-xl border bg-card">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden
                    >
                      <Mail className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{invitation.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Invited as {invitation.role.toLowerCase()} · expires{" "}
                        {formatDistanceToNow(new Date(invitation.expiresAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setRevoking(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Users}
                title="No pending invitations"
                description="Invite a teammate by email and they'll appear here until they join."
                className="rounded-xl border bg-card py-10"
              />
            )}
          </section>
        ) : null}
      </div>

      <InviteDialog open={inviting} onOpenChange={setInviting} />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name ?? "this member"}?`}
        description="They lose access to this workspace immediately. Anything they created stays."
        confirmLabel="Remove"
        pendingLabel="Removing…"
        destructive
        pending={removeMember.isPending}
        onConfirm={() => {
          if (!removing) return;
          removeMember.mutate(removing.id, { onSuccess: () => setRemoving(null) });
        }}
      />

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke this invitation?"
        description="The link stops working straight away. You can always send a new one."
        confirmLabel="Revoke"
        pendingLabel="Revoking…"
        destructive
        pending={revokeInvitation.isPending}
        onConfirm={() => {
          if (!revoking) return;
          revokeInvitation.mutate(revoking, { onSuccess: () => setRevoking(null) });
        }}
      />
    </div>
  );
}
