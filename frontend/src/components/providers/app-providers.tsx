"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { TourProvider } from "@/components/onboarding/use-tour";
import { Toaster } from "@/components/ui/sonner";
import { ColorModeProvider } from "./color-mode-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
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
          <TourProvider>
            {children}
            <Toaster position="bottom-right" />
          </TourProvider>
        </ColorModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
