"use client";

import { ChevronDown, LayoutGrid, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const NAV_ITEMS = [
  { title: "Tasks", href: "/tasks", icon: LayoutGrid },
  { title: "Projects", href: "/projects", icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild className="text-sm text-sidebar-foreground hover:bg-sidebar-accent">
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
                <SidebarMenu>
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
    </Sidebar>
  );
}
