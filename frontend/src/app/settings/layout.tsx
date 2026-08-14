"use client";

import { ArrowLeft, Palette, Search, SunMedium, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Profile", href: "/settings", icon: UserRound },
  { title: "Theme", href: "/settings/theme", icon: SunMedium },
  { title: "Color", href: "/settings/color", icon: Palette },
  { title: "Members", href: "/settings/members", icon: Users },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const items = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar px-4 py-4 sm:flex">
        <Link
          href="/tasks"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to app
        </Link>

        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-9 bg-background pl-8"
          />
        </div>

        <nav aria-label="Settings">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                    pathname === item.href && "bg-sidebar-accent",
                  )}
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile back link */}
        <div className="border-b px-4 py-3 sm:hidden">
          <Link href="/tasks" className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" aria-hidden />
            Back to app
          </Link>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
          {children}
        </div>
      </div>
    </div>
  );
}
