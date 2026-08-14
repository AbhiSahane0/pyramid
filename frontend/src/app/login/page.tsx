"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Google sign-in didn't complete. Please try again.",
  oauth_unconfigured:
    "Google sign-in isn't configured on this server yet. Continue as guest instead.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12.24 10.285v3.984h5.635c-.227 1.462-1.703 4.285-5.635 4.285-3.391 0-6.158-2.809-6.158-6.27s2.767-6.27 6.158-6.27c1.93 0 3.222.822 3.962 1.532l2.698-2.598C17.167 3.327 14.92 2.31 12.24 2.31c-5.37 0-9.71 4.34-9.71 9.71s4.34 9.71 9.71 9.71c5.605 0 9.322-3.94 9.322-9.487 0-.638-.069-1.125-.152-1.61l-9.17-.348Z" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = OAUTH_ERRORS[searchParams.get("error") ?? ""];

  const queryClient = useQueryClient();
  const guestLogin = useMutation({
    mutationFn: api.auth.guestLogin,
    onSuccess: () => {
      // Anything cached belongs to the signed-out state, including the failed
      // workspaces lookup that decides which board to show.
      queryClient.clear();
      router.push("/tasks");
      router.refresh();
    },
  });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-xl flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Logo className="size-10 rounded-xl" />
          <span className="text-2xl font-bold tracking-tight">Pyramid</span>
        </div>

        <div className="w-full rounded-3xl border bg-card px-6 py-10 shadow-xs sm:px-12">
          <div className="mx-auto flex max-w-md flex-col gap-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Let&apos;s get back on track
              </h1>
              <p className="text-lg text-muted-foreground">
                Enter your email below to login to your account.
              </p>
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                className="h-13 w-full rounded-full text-base font-semibold"
                disabled={guestLogin.isPending}
                onClick={() => guestLogin.mutate()}
              >
                {guestLogin.isPending ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : null}
                Continue as Guest
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 w-full rounded-full text-base font-semibold"
              >
                <a href={api.auth.googleLoginUrl}>
                  <GoogleIcon />
                  Login with Google
                </a>
              </Button>
            </div>

            {guestLogin.isError ? (
              <p role="alert" className="text-center text-sm text-destructive">
                Couldn&apos;t create a guest session. Is the API running?
              </p>
            ) : null}
          </div>
        </div>

        <p className="max-w-xs text-center text-base text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
