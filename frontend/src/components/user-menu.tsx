"use client";

import {
  Check,
  ChevronsUpDown,
  Loader2,
  LogOut,
  Moon,
  Settings,
  Sun,
  SunMedium,
  Square,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useMounted } from "@/hooks/use-mounted";
import {
  COLOR_MODES,
  useColorMode,
  type ColorMode,
} from "@/components/providers/color-mode-provider";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useLogout, useMe } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES: Record<ColorMode, string> = {
  amber: "bg-amber-600",
  blue: "bg-violet-600",
  pink: "bg-pink-600",
  rose: "bg-rose-600",
  emerald: "bg-emerald-600",
  black: "bg-transparent",
};

function colorModeLabel(mode: ColorMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

/**
 * The sidebar-header account menu from the design: profile card, Change
 * Theme (Light/Dark), Color Mode (six accents) and Settings.
 */
export function UserMenu() {
  const { data: user } = useMe();
  const { theme, setTheme } = useTheme();
  const { colorMode, setColorMode } = useColorMode();
  const logout = useLogout();
  const mounted = useMounted();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const name = user?.name ?? "Workspace";
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="gap-2.5">
          <UserAvatar name={name} avatarUrl={user?.avatarUrl} className="size-8" />
          <span className="flex-1 truncate text-left text-sm font-semibold">{name}</span>
          <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-64 rounded-xl p-2">
        <div className="mb-2 flex flex-col items-center gap-1.5 rounded-lg border bg-card px-4 py-4 shadow-xs">
          <UserAvatar name={name} avatarUrl={user?.avatarUrl} className="size-12" />
          <div className="text-center">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-md px-2 py-2">
            {mounted && theme === "dark" ? (
              <Moon className="size-4" aria-hidden />
            ) : (
              <SunMedium className="size-4" aria-hidden />
            )}
            Change Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44 rounded-xl p-1.5" sideOffset={8}>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                <Sun className="size-4" aria-hidden />
                Light
                {mounted && theme === "light" ? (
                  <Check className="ml-auto size-4" aria-hidden />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                <Moon className="size-4" aria-hidden />
                Dark
                {mounted && theme === "dark" ? (
                  <Check className="ml-auto size-4" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-md px-2 py-2">
            <span
              className={cn(
                "size-4 rounded-[5px]",
                colorMode === "black"
                  ? "bg-zinc-900 dark:bg-zinc-100"
                  : COLOR_SWATCHES[colorMode],
              )}
              aria-hidden
            />
            Color Mode
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44 rounded-xl p-1.5" sideOffset={8}>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Color Mode
              </DropdownMenuLabel>
              {COLOR_MODES.map((mode) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className="gap-2"
                >
                  {mode === "black" ? (
                    <Square className="size-4 opacity-0" aria-hidden />
                  ) : (
                    <span
                      className={cn("size-4 rounded-[5px]", COLOR_SWATCHES[mode])}
                      aria-hidden
                    />
                  )}
                  {colorModeLabel(mode)}
                  {colorMode === mode ? (
                    <Check className="ml-auto size-4" aria-hidden />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuItem asChild className="gap-2 rounded-md px-2 py-2">
          <Link href="/settings">
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 rounded-md px-2 py-2"
          disabled={logout.isPending}
          onSelect={() => setConfirmingLogout(true)}
        >
          {logout.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4" aria-hidden />
          )}
          {logout.isPending ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ConfirmDialog
        open={confirmingLogout}
        onOpenChange={setConfirmingLogout}
        title="Log out?"
        description={
          user?.isGuest
            ? "You're signed in as a guest — this demo workspace and everything in it is deleted when the session ends and cannot be recovered."
            : "You'll be signed out of Pyramid and returned to the login page. Your work stays saved."
        }
        confirmLabel="Log out"
        pendingLabel="Signing out…"
        pending={logout.isPending}
        destructive={user?.isGuest}
        onConfirm={() =>
          logout.mutate(undefined, {
            // Leave the dialog up on failure so the error toast is readable
            // against a stable screen rather than a half-torn-down menu.
            onSuccess: () => setConfirmingLogout(false),
          })
        }
      />
    </DropdownMenu>
  );
}
