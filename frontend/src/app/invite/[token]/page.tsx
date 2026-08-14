"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Loader2, LogIn, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcceptInvitation, useMe } from "@/hooks/use-api";
import { api, ApiError } from "@/lib/api";

/**
 * Landing page for a magic-link invitation.
 *
 * Deliberately handles every way this can go wrong, because the invitee has no
 * other context: the link may be expired, already used or revoked; they may be
 * signed out; or they may be signed in as the wrong person — which is the
 * likeliest confusion, since invites are bound to one address.
 */
export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [joined, setJoined] = useState(false);

  const {
    data: invitation,
    isPending,
    error,
  } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => api.invitations.preview(token),
    retry: false,
  });

  // `me` 401s when signed out, which is a valid state here rather than an error.
  const { data: me, isPending: mePending } = useMe();
  const accept = useAcceptInvitation();

  if (isPending || mePending) {
    return (
      <Shell>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-40" />
      </Shell>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError ? error.message : "This invitation link is not valid.";
    return (
      <Shell>
        <Status icon={CircleAlert} tone="error" title="This link doesn't work" />
        <p className="text-sm text-balance text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          Ask whoever invited you to send a new one.
        </p>
        <Button variant="outline" onClick={() => router.push("/tasks")}>
          Go to Pyramid
        </Button>
      </Shell>
    );
  }

  if (joined) {
    return (
      <Shell>
        <Status
          icon={Users}
          tone="success"
          title={`You're in ${invitation.workspaceName}`}
        />
        <p className="text-sm text-muted-foreground">
          Switch to it any time from the workspace menu in the sidebar.
        </p>
        <Button onClick={() => router.push("/tasks")}>Open the board</Button>
      </Shell>
    );
  }

  const invitedBy = invitation.invitedByName ?? "Someone";

  // Signed out: send them to Google, then straight back to this link.
  if (!me) {
    return (
      <Shell>
        <Status
          icon={Users}
          title={`${invitedBy} invited you to ${invitation.workspaceName}`}
        />
        <p className="text-sm text-balance text-muted-foreground">
          The invitation was sent to <strong>{invitation.email}</strong>. Sign in with
          that account to accept it.
        </p>
        <Button asChild className="gap-2">
          <a href={api.auth.googleLoginUrl}>
            <LogIn className="size-4" aria-hidden />
            Sign in with Google
          </a>
        </Button>
      </Shell>
    );
  }

  // Signed in as somebody else: the API would refuse, so say so up front.
  const wrongAccount = me.email.toLowerCase() !== invitation.email.toLowerCase();
  if (wrongAccount) {
    return (
      <Shell>
        <Status icon={CircleAlert} tone="error" title="Wrong account" />
        <p className="text-sm text-balance text-muted-foreground">
          This invitation is for <strong>{invitation.email}</strong>, but you&apos;re
          signed in as <strong>{me.email}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Sign out and back in with the invited account to accept.
        </p>
        <Button variant="outline" onClick={() => router.push("/tasks")}>
          Go to Pyramid
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <Status
        icon={Users}
        title={`${invitedBy} invited you to ${invitation.workspaceName}`}
      />
      <p className="text-sm text-balance text-muted-foreground">
        You&apos;ll join as {invitation.role.toLowerCase()} and see everything on the
        workspace&apos;s board.
      </p>
      <Button
        className="gap-1.5"
        disabled={accept.isPending}
        onClick={() =>
          accept.mutate(token, {
            onSuccess: () => setJoined(true),
          })
        }
      >
        {accept.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {accept.isPending ? "Joining…" : `Join ${invitation.workspaceName}`}
      </Button>
      {accept.isError ? (
        <p className="text-sm text-destructive">
          {accept.error instanceof ApiError
            ? accept.error.message
            : "Could not join the workspace."}
        </p>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo className="size-10 rounded-xl" />
      {children}
    </main>
  );
}

function Status({
  icon: Icon,
  title,
  tone = "neutral",
}: {
  icon: typeof Users;
  title: string;
  tone?: "neutral" | "error" | "success";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={
          tone === "error"
            ? "flex size-12 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive"
            : tone === "success"
              ? "flex size-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "flex size-12 items-center justify-center rounded-2xl border bg-muted text-muted-foreground"
        }
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <h1 className="max-w-md text-xl font-bold text-balance">{title}</h1>
    </div>
  );
}
