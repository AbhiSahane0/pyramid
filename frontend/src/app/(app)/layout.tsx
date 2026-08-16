import { Suspense, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { HelpMenu } from "@/components/help-menu";
import { TopbarBreadcrumb } from "@/components/topbar-breadcrumb";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { TaskFilterProvider } from "@/components/providers/task-filter-provider";
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

        {/* Reading filters from the URL opts this subtree out of prerendering,
            so the boundary is drawn tightly around it: the sidebar and header
            still ship as static HTML, and only the area that renders its own
            loading skeletons anyway waits for the client. The assistant lives
            inside because it drives the same filters — it is fixed-positioned,
            so nesting does not move it. */}
        <Suspense fallback={<div className="min-h-0 flex-1" />}>
          <TaskFilterProvider>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            <AssistantWidget />
          </TaskFilterProvider>
        </Suspense>
      </SidebarInset>
      <OnboardingTour />
    </SidebarProvider>
  );
}
