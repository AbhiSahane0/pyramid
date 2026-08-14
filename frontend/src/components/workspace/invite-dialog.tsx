"use client";

import { Check, Copy, Loader2, Send, TriangleAlert } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteMember } from "@/hooks/use-api";
import type { CreatedInvitation, WorkspaceRole } from "@/lib/types";

function CopyLinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={url} className="font-mono text-xs" />
      <Button
        type="button"
        variant="outline"
        className="shrink-0 gap-1.5"
        onClick={() => {
          void navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Invites someone by email. The created link is shown afterwards regardless of
 * whether the email went out — with no mail provider configured it is the only
 * way to share the invite, and even with one it's a useful fallback.
 */
export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const invite = useInviteMember();

  const reset = () => {
    setEmail("");
    setRole("MEMBER");
    setCreated(null);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    invite.mutate({ email: trimmed, role }, { onSuccess: setCreated });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{created ? "Invitation ready" : "Invite people"}</DialogTitle>
          <DialogDescription>
            {created
              ? created.emailed
                ? `We emailed ${created.email}. You can also share this link directly.`
                : `Send this link to ${created.email} to add them to the workspace.`
              : "They'll get a link that adds them to this workspace. It expires in 7 days and works once."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <CopyLinkField url={created.inviteUrl} />
            {created.deliveryError ? (
              <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-amber-600"
                  aria-hidden
                />
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold">
                    The email couldn&apos;t be delivered
                  </p>
                  <p className="text-xs break-words text-muted-foreground">
                    {created.deliveryError}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The invitation itself is valid — share the link above instead.
                  </p>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Only {created.email} can accept it — a forwarded link won&apos;t work for
              anyone else.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                autoFocus
                placeholder="teammate@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as WorkspaceRole)}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member — can use the board</SelectItem>
                  <SelectItem value="ADMIN">
                    Admin — can also invite and manage people
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {created ? (
            <>
              <Button variant="ghost" onClick={() => setCreated(null)}>
                Invite someone else
              </Button>
              <Button onClick={() => close(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => close(false)}
                disabled={invite.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={invite.isPending || !email.trim()}
                className="gap-1.5"
              >
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {invite.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
