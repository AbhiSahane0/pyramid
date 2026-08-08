import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpMenu } from "@/components/help-menu";
import { TopbarBreadcrumb } from "@/components/topbar-breadcrumb";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    // h-svh pins the shell to the viewport so only the content area scrolls.
    <SidebarProvider className="h-svh">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" data-tour="sidebar-toggle" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <TopbarBreadcrumb />
          <div className="ml-auto flex items-center gap-1">
            <HelpMenu />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </SidebarInset>
      <OnboardingTour />
    </SidebarProvider>
  );
}
