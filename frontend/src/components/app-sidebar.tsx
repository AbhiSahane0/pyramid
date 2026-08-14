"use client";

import { ChevronDown, LayoutGrid, Package, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMe } from "@/hooks/use-api";
import { api } from "@/lib/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const NAV_ITEMS = [
  { title: "Tasks", href: "/tasks", icon: LayoutGrid },
  { title: "Projects", href: "/projects", icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: user } = useMe();

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem data-tour="user-menu">
            <UserMenu />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <WorkspaceSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="text-sm text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <CollapsibleTrigger>
                Workspace
                <ChevronDown
                  className="ml-auto size-4 transition-transform group-data-[state=closed]/collapsible:-rotate-90"
                  aria-hidden
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="pt-1">
                <SidebarMenu data-tour="sidebar-nav">
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        className="gap-2.5"
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      {user?.isGuest ? (
        <SidebarFooter className="px-3 pb-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <TriangleAlert className="size-3.5 text-amber-600" aria-hidden />
              Guest workspace
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This demo workspace is temporary. Sign in with Google to keep your work.
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-2 h-7 w-full text-xs"
            >
              <a href={api.auth.googleLoginUrl}>Sign in with Google</a>
            </Button>
          </div>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
