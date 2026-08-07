"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProjects } from "@/hooks/use-api";

/** Shows "Projects > {name}" in the topbar on project detail pages. */
export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const { data: projects } = useProjects();

  const match = /^\/projects\/([^/]+)/.exec(pathname);
  if (!match) return null;
  const project = projects?.find((p) => p.id === match[1]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/projects">Projects</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{project?.name ?? "…"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
