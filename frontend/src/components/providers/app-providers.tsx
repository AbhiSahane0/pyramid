"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { TourProvider } from "@/components/onboarding/use-tour";
import { Toaster } from "@/components/ui/sonner";
import { ColorModeProvider } from "./color-mode-provider";
import { WorkspaceProvider } from "./workspace-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // A board is shared, so what it shows can be made wrong by someone
            // else — a project deleted in another browser stays on screen here
            // until something asks the server again. Navigating remounts the
            // query and does that; sitting still never did, so a member could
            // spend an afternoon looking at work that no longer exists.
            // Coming back to the tab is exactly the moment to catch up, and
            // the staleTime below keeps that from being a request per glance.
            refetchOnWindowFocus: true,
            staleTime: 10_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ColorModeProvider>
          <WorkspaceProvider>
            <TourProvider>
              {children}
              <Toaster position="bottom-right" />
            </TourProvider>
          </WorkspaceProvider>
        </ColorModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
