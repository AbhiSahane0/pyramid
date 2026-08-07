"use client";

import {
  Check,
  Columns3,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusDot } from "@/components/tasks/pickers";
import { PriorityIcon } from "@/components/tasks/priority-badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useLabels, useMembers } from "@/hooks/use-api";
import type { TaskField, ViewMode, ViewPrefs } from "@/hooks/use-view-prefs";
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  type TaskFilters,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const FIELD_OPTIONS: { key: TaskField; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "members", label: "Members" },
  { key: "dueDate", label: "Due Date" },
  { key: "labels", label: "Labels" },
  { key: "status", label: "Status" },
  { key: "reporter", label: "Reporter" },
];

interface ViewHeaderProps {
  title: string;
  prefs: ViewPrefs;
  onModeChange: (mode: ViewMode) => void;
  onToggleField: (field: TaskField) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onAddTask: () => void;
}

export function ViewHeader({
  title,
  prefs,
  onModeChange,
  onToggleField,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  onAddTask,
}: ViewHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: members = [] } = useMembers();
  const { data: labels = [] } = useLabels();

  // ⌘F / Ctrl+F opens the task search, as hinted in the design's search bar.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterCount = Object.values(filters).filter(Boolean).length;

  const setFilter = (patch: Partial<TaskFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>

      <div className="flex flex-1 items-center justify-end gap-2">
        {searchOpen ? (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onSearchChange("");
                  setSearchOpen(false);
                }
              }}
              placeholder="Search tasks…"
              className="h-9 pl-8 pr-16"
            />
            <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onSearchChange("");
                    searchRef.current?.focus();
                  }}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                ⌘F
              </kbd>
            </span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            aria-label="Search tasks"
            className="size-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" aria-hidden />
          </Button>
        )}

        {/* Fields: view mode toggle + visible columns */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 gap-2 px-3">
              <Columns3 className="size-4" aria-hidden />
              Fields
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 rounded-xl p-2">
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  { mode: "list", label: "List", icon: List },
                  { mode: "board", label: "Board", icon: LayoutGrid },
                ] as const
              ).map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    prefs.mode === mode
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
            <ul>
              {FIELD_OPTIONS.map(({ key, label }) => (
                <li key={key} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent">
                  <span className="text-sm">{label}</span>
                  <Checkbox
                    checked={prefs.fields[key]}
                    onCheckedChange={() => onToggleField(key)}
                    aria-label={`Toggle ${label}`}
                    className="size-5 rounded-md data-[state=unchecked]:border-transparent data-[state=unchecked]:bg-muted-foreground/20"
                  />
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Filter tasks" className="relative size-9">
              <Filter className="size-4" aria-hidden />
              {filterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
                  {filterCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <span className="flex size-4 items-center justify-center">
                  <StatusDot status={filters.status ?? "TODO"} className={filters.status ? "" : "bg-muted-foreground/40"} />
                </span>
                Status
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-44 rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Status</DropdownMenuLabel>
                  {STATUS_ORDER.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      className="gap-2"
                      onClick={() =>
                        setFilter({ status: filters.status === status ? undefined : status })
                      }
                    >
                      <StatusDot status={status} />
                      {STATUS_META[status].label}
                      {filters.status === status ? <Check className="ml-auto size-4" aria-hidden /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <PriorityIcon priority={filters.priority ?? "HIGH"} className={filters.priority ? "" : "text-muted-foreground"} />
                Priority
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-44 rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Priority</DropdownMenuLabel>
                  {PRIORITY_ORDER.map((priority) => (
                    <DropdownMenuItem
                      key={priority}
                      className={cn("gap-2", PRIORITY_META[priority].textClass)}
                      onClick={() =>
                        setFilter({ priority: filters.priority === priority ? undefined : priority })
                      }
                    >
                      <PriorityIcon priority={priority} />
                      {PRIORITY_META[priority].label}
                      {filters.priority === priority ? (
                        <Check className="ml-auto size-4 text-foreground" aria-hidden />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Users className="size-4" aria-hidden />
                Members
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Members</DropdownMenuLabel>
                  {members.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      onClick={() =>
                        setFilter({ memberId: filters.memberId === member.id ? undefined : member.id })
                      }
                    >
                      {member.name}
                      {filters.memberId === member.id ? <Check className="ml-auto size-4" aria-hidden /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Tag className="size-4" aria-hidden />
                Labels
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-72 w-48 overflow-y-auto rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Labels</DropdownMenuLabel>
                  {labels.map((label) => (
                    <DropdownMenuItem
                      key={label.id}
                      onClick={() =>
                        setFilter({ labelId: filters.labelId === label.id ? undefined : label.id })
                      }
                    >
                      {label.name}
                      {filters.labelId === label.id ? <Check className="ml-auto size-4" aria-hidden /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <User className="size-4" aria-hidden />
                Reporter
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Reporter</DropdownMenuLabel>
                  {members.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      onClick={() =>
                        setFilter({
                          reporterId: filters.reporterId === member.id ? undefined : member.id,
                        })
                      }
                    >
                      {member.name}
                      {filters.reporterId === member.id ? <Check className="ml-auto size-4" aria-hidden /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {filterCount > 0 ? (
              <DropdownMenuItem
                className="mt-1 justify-center border-t pt-2 text-muted-foreground"
                onClick={() => onFiltersChange({})}
              >
                Clear filters
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="h-9 gap-1.5 px-3.5 font-semibold" onClick={onAddTask}>
          <Plus className="size-4" aria-hidden />
          Add Task
        </Button>
      </div>
    </div>
  );
}
