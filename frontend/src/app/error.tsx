"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Root error boundary — a friendly fallback for anything unexpected. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or refresh the page.
        </p>
      </div>
      <Button variant="outline" onClick={reset} className="gap-1.5">
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </Button>
    </main>
  );
}
