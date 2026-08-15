"use client";

import { format } from "date-fns";
import {
  ArrowUp,
  CalendarCheck,
  Check,
  CircleAlert,
  CornerDownLeft,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateProject,
  useCreateTask,
  useDeleteTask,
  useInviteMember,
  useRemoveMember,
  useTasks,
  useUpdateMemberRole,
  useUpdateTask,
  useWorkspaceMembers,
} from "@/hooks/use-api";
import { useMounted } from "@/hooks/use-mounted";
import { ApiError } from "@/lib/api";
import { STATUS_META } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  availableCommands,
  filterCommands,
  suggestCommand,
  type AssistantCommand,
  type CommandRunners,
} from "./commands";
import { API_DATE, dateShortcuts, describeDate, parseDate } from "./dates";
import { PickerList, type PickerItem } from "./picker-list";

interface Message {
  id: string;
  role: "user" | "assistant";
  body: string;
  tone?: "ok" | "error";
  /** Offered as a one-click shortcut when plain text looks like an action. */
  suggestion?: AssistantCommand;
}

/** Remembers that the launcher has been opened, so it stops asking for attention. */
const ENGAGED_KEY = "pyramid-assistant-engaged";
const PULSE_EVERY_MS = 14_000;
const PULSE_FOR_MS = 2_600;

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  body: "Hi — I'm Pyramid's assistant. Type @ to run an action like creating a task or inviting someone, and I'll walk you through it one step at a time.",
};

/** Sentinel id for the "skip this step" row. */
const SKIP = "__skip__";

interface Flow {
  command: AssistantCommand;
  values: Record<string, string>;
  labels: Record<string, string>;
  /** Index into command.args; equal to args.length means "ready to run". */
  step: number;
  error?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The "@query" being typed, or null when the menu shouldn't show. A second
 * word is allowed so typing a label as it is written — "@create task" — keeps
 * matching; anything longer is prose, and the menu gets out of the way.
 */
function mentionQuery(draft: string): string | null {
  const match = /(?:^|\s)@([\w-]*(?: [\w-]+)?)$/.exec(draft);
  return match ? match[1] : null;
}

export function AssistantWidget() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  // Read lazily rather than in an effect: the whole widget renders nothing
  // until mounted, so there is no server/client markup to disagree about.
  const [engaged, setEngaged] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(ENGAGED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pulsing, setPulsing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [flow, setFlow] = useState<Flow | null>(null);
  const [highlight, setHighlight] = useState({ key: "", index: 0 });
  const [running, setRunning] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { activeWorkspace } = useWorkspace();
  const { data: members = [] } = useWorkspaceMembers();
  const { data: tasks = [] } = useTasks();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createProject = useCreateProject();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();

  const runners: CommandRunners = useMemo(
    () => ({
      createTask: (input) => createTask.mutateAsync(input),
      updateTask: (id, input) => updateTask.mutateAsync({ id, input }),
      deleteTask: (id) => deleteTask.mutateAsync(id),
      createProject: (input) => createProject.mutateAsync(input),
      inviteMember: (input) => inviteMember.mutateAsync(input),
      removeMember: (userId) => removeMember.mutateAsync(userId),
      updateMemberRole: (userId, role) => updateMemberRole.mutateAsync({ userId, role }),
    }),
    [
      createTask,
      updateTask,
      deleteTask,
      createProject,
      inviteMember,
      removeMember,
      updateMemberRole,
    ],
  );

  const commands = useMemo(
    () => availableCommands(activeWorkspace?.role),
    [activeWorkspace?.role],
  );

  const query = flow ? null : mentionQuery(draft);
  const currentArg =
    flow && flow.step < flow.command.args.length ? flow.command.args[flow.step] : null;
  const readyToRun = Boolean(flow && flow.step === flow.command.args.length);
  // Only steps already behind the cursor become chips. Stepping back with
  // Backspace re-asks a question, and showing its old answer as "done" right
  // above the same question reads as if it had already been handled.
  const chips = flow
    ? flow.command.args.slice(0, flow.step).filter((arg) => flow.labels[arg.key])
    : [];

  /** Rows shown above the composer: either the @ menu or the current step's options. */
  const items: PickerItem[] | null = useMemo(() => {
    if (query !== null) {
      return filterCommands(commands, query).map((command) => ({
        id: command.id,
        label: command.label,
        description: command.hint,
        icon: command.icon,
        group: command.group,
      }));
    }

    if (!currentArg) return null;
    const filter = draft.trim().toLowerCase();
    const matches = (text: string) => !filter || text.toLowerCase().includes(filter);

    let rows: PickerItem[] = [];
    if (currentArg.kind === "choice" || currentArg.kind === "confirm") {
      rows = (currentArg.options ?? [])
        .filter((option) => matches(option.label))
        .map((option) => ({
          id: option.value,
          label: option.label,
          description: option.description,
        }));
    } else if (currentArg.kind === "member") {
      rows = members
        .filter((member) => matches(member.name) || matches(member.email))
        .map((member) => ({
          id: member.id,
          label: member.name,
          description: member.email,
        }));
    } else if (currentArg.kind === "task") {
      rows = tasks
        .filter((task) => matches(task.title))
        .slice(0, 40)
        .map((task) => ({
          id: task.id,
          label: task.title,
          description: STATUS_META[task.status].label,
        }));
    } else if (currentArg.kind === "date") {
      const typed = draft.trim();
      const parsed = typed ? parseDate(typed) : null;
      if (parsed) {
        // What was typed is read back as a real date, so "next friday" is
        // confirmed as a weekday and a number before it is accepted.
        rows = [
          {
            id: format(parsed, API_DATE),
            label: describeDate(parsed),
            description: `From “${typed}”`,
            icon: CalendarCheck,
          },
        ];
      } else if (typed) {
        // Unreadable: offer nothing, so Enter falls through to validation and
        // explains itself rather than quietly picking a shortcut.
        return [];
      } else {
        rows = dateShortcuts().map((shortcut) => ({
          id: shortcut.value,
          label: shortcut.label,
          description: shortcut.description,
        }));
      }
    } else {
      return null; // free-text steps have no list
    }

    if (currentArg.optional) {
      rows = [
        ...rows,
        { id: SKIP, label: currentArg.skipLabel ?? "Skip this step", muted: true },
      ];
    }
    return rows;
  }, [query, commands, currentArg, draft, members, tasks]);

  // The highlight belongs to one particular list. Storing the list it was
  // chosen for — rather than resetting it from an effect — means a new list
  // starts at its first row on the very same render, with no flash of a
  // stale selection.
  const listKey = `${query ?? ""}|${flow?.command.id ?? ""}|${flow?.step ?? -1}|${draft}`;
  const activeIndex = highlight.key === listKey ? highlight.index : 0;
  const setActiveIndex = (update: number | ((index: number) => number)) =>
    setHighlight((current) => {
      const base = current.key === listKey ? current.index : 0;
      return {
        key: listKey,
        index: typeof update === "function" ? update(base) : update,
      };
    });

  // Periodic nudge, until it has been opened once.
  useEffect(() => {
    if (open || engaged || prefersReducedMotion()) return;
    let timeout: number | undefined;
    const flash = () => {
      setPulsing(true);
      timeout = window.setTimeout(() => setPulsing(false), PULSE_FOR_MS);
    };
    const first = window.setTimeout(flash, 3_000);
    const interval = window.setInterval(flash, PULSE_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [open, engaged]);

  // Keep the newest message in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, running, flow, open]);

  const say = (body: string, tone?: Message["tone"]) =>
    setMessages((current) => [
      ...current,
      { id: `a-${Date.now()}-${Math.random()}`, role: "assistant", body, tone },
    ]);

  const openPanel = () => {
    setOpen(true);
    setPulsing(false);
    setEngaged(true);
    try {
      window.localStorage.setItem(ENGAGED_KEY, "1");
    } catch {
      // Non-fatal: the launcher will pulse again next session.
    }
    window.setTimeout(() => inputRef.current?.focus(), 120);
  };

  const startCommand = (command: AssistantCommand) => {
    setDraft("");
    setFlow({ command, values: {}, labels: {}, step: 0 });
  };

  const cancelFlow = (announce = true) => {
    if (flow && announce) say(`Cancelled ${flow.command.label.toLowerCase()}.`);
    setFlow(null);
    setDraft("");
  };

  const advance = (key: string, value: string, label: string) => {
    setFlow((current) =>
      current
        ? {
            ...current,
            values: { ...current.values, ...(value ? { [key]: value } : {}) },
            labels: { ...current.labels, ...(label ? { [key]: label } : {}) },
            step: current.step + 1,
            error: undefined,
          }
        : current,
    );
    setDraft("");
  };

  const goBack = () => {
    setFlow((current) =>
      current && current.step > 0
        ? { ...current, step: current.step - 1, error: undefined }
        : current,
    );
    setDraft("");
  };

  const selectItem = (item: PickerItem) => {
    // Picking a command from the @ menu.
    if (query !== null) {
      const command = commands.find((c) => c.id === item.id);
      if (command) startCommand(command);
      return;
    }
    if (!currentArg || !flow) return;

    // "Cancel" on a confirmation step abandons the whole command.
    if (currentArg.kind === "confirm" && item.id === "no") {
      cancelFlow();
      return;
    }
    if (item.id === SKIP) {
      advance(currentArg.key, "", "");
      return;
    }
    // Dates are recorded as the full date whichever row was picked, so the
    // review line never says the vaguer "Tomorrow".
    if (currentArg.kind === "date") {
      const date = parseDate(item.id);
      advance(currentArg.key, item.id, date ? describeDate(date) : item.label);
      return;
    }
    advance(currentArg.key, item.id, item.label);
  };

  const submitText = () => {
    if (!flow || !currentArg) return;
    const value = draft.trim();
    const error = currentArg.validate?.(value) ?? null;
    if (error) {
      setFlow({ ...flow, error });
      return;
    }
    if (currentArg.kind === "date") {
      const date = parseDate(value);
      if (date) {
        advance(currentArg.key, format(date, API_DATE), describeDate(date));
        return;
      }
    }
    advance(currentArg.key, value, value);
  };

  const runCommand = async () => {
    if (!flow || running) return;
    const { command, values, labels } = flow;
    setRunning(true);
    setMessages((current) => [
      ...current,
      {
        id: `u-${Date.now()}`,
        role: "user",
        body: command.review(values, labels),
      },
    ]);

    try {
      const result = await command.run(values, runners, labels);
      setFlow(null);
      say(result, "ok");
    } catch (error) {
      setFlow(null);
      say(
        error instanceof ApiError ? error.message : "That didn't work. Please try again.",
        "error",
      );
    } finally {
      setRunning(false);
      setDraft("");
    }
  };

  const sendFreeText = () => {
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", body }]);
    setDraft("");

    // Answering questions needs a model behind it, which this doesn't have yet.
    // What it can do is notice that the sentence describes an action it knows
    // and offer to run it, so the request isn't simply refused.
    const suggestion = suggestCommand(commands, body);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          body: suggestion
            ? "I can't answer questions yet — but this looks like something I can do:"
            : "I can't answer questions yet — that part is still being built. For now, type @ and I'll run an action for you.",
          suggestion: suggestion ?? undefined,
        },
      ]);
    }, 500);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigating a list takes precedence over everything else.
    if (items && items.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectItem(items[activeIndex]);
        return;
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (flow) cancelFlow();
      else setDraft("");
      return;
    }

    // An empty composer plus Backspace steps back through the command.
    if (event.key === "Backspace" && !draft && flow && flow.step > 0) {
      event.preventDefault();
      goBack();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (readyToRun) void runCommand();
      else if (currentArg) submitText();
      else sendFreeText();
    }
  };

  if (!mounted) return null;

  const placeholder = flow
    ? readyToRun
      ? "Press Enter to run, Esc to cancel"
      : (currentArg?.placeholder ?? "")
    : "Ask something, or type @ for actions";

  return (
    <>
      <button
        type="button"
        aria-label="Open the assistant"
        aria-expanded={open}
        data-tour="assistant"
        onClick={openPanel}
        className={cn(
          "group fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-zinc-800 to-zinc-950 text-white shadow-lg shadow-black/20",
          "ring-1 ring-white/10 transition-transform duration-200",
          "hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900",
          open && "pointer-events-none scale-90 opacity-0",
        )}
      >
        {pulsing ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <span className="absolute -inset-1 rounded-full bg-primary/10 blur-md" />
          </>
        ) : null}
        <Sparkles className="relative size-6" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Pyramid assistant"
          // Deliberately not a modal: no overlay, no outside-click close and no
          // Escape-to-close, so the board stays usable while it's open.
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
            "inset-x-3 top-16 bottom-3",
            "sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-5 sm:h-[min(36rem,calc(100svh-6rem))] sm:w-[26rem]",
          )}
        >
          <header className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
              aria-hidden
            >
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Assistant</p>
              <p className="truncate text-xs text-muted-foreground">
                {activeWorkspace?.name ?? "Workspace"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Close the assistant"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[85%] items-start gap-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : message.tone === "ok"
                        ? "rounded-bl-sm border border-emerald-500/30 bg-emerald-500/10"
                        : message.tone === "error"
                          ? "rounded-bl-sm border border-destructive/30 bg-destructive/10"
                          : "rounded-bl-sm bg-muted",
                  )}
                >
                  {message.tone === "ok" ? (
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                  ) : null}
                  {message.tone === "error" ? (
                    <CircleAlert
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      aria-hidden
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p>{message.body}</p>
                    {message.suggestion ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1.5 bg-background"
                        onClick={() => {
                          const command = message.suggestion;
                          if (command) startCommand(command);
                        }}
                      >
                        <message.suggestion.icon className="size-3.5" aria-hidden />
                        {message.suggestion.label}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {running ? (
              <div className="flex justify-start" role="status">
                <span className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Working on it…
                </span>
              </div>
            ) : null}
          </div>

          {/* Active command: what's collected, and what's being asked next. */}
          {flow ? (
            <div className="mx-3 mb-2 rounded-xl border bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                <flow.command.icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {flow.command.label}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      {readyToRun
                        ? "ready"
                        : `step ${flow.step + 1} of ${flow.command.args.length}`}
                    </span>
                  </p>

                  {chips.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {chips.map((arg) => (
                        <span
                          key={arg.key}
                          className="rounded-md bg-background px-1.5 py-0.5 text-[0.7rem] ring-1 ring-border"
                        >
                          <span className="text-muted-foreground">{arg.label}: </span>
                          {flow.labels[arg.key]}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-1.5 text-sm">
                    {readyToRun
                      ? flow.command.review(flow.values, flow.labels)
                      : currentArg?.prompt}
                  </p>

                  {flow.error ? (
                    <p className="mt-1 text-xs text-destructive">{flow.error}</p>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground"
                  aria-label="Cancel this action"
                  onClick={() => cancelFlow()}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>

              {readyToRun ? (
                <div className="mt-2.5 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => cancelFlow()}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={running}
                    variant={flow.command.destructive ? "destructive" : "default"}
                    onClick={() => void runCommand()}
                  >
                    {running ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <CornerDownLeft className="size-3.5" aria-hidden />
                    )}
                    {running ? "Running…" : "Run"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {items && items.length >= 0 && !readyToRun ? (
            <PickerList
              items={items}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelect={selectItem}
              title={
                query !== null
                  ? "Actions"
                  : currentArg?.kind === "date"
                    ? "Pick a date, or type one"
                    : undefined
              }
              emptyLabel={
                query !== null
                  ? "No matching action"
                  : currentArg?.kind === "date"
                    ? "That isn't a date I can read yet — keep typing"
                    : "Nothing to choose from yet"
              }
            />
          ) : null}

          <div className="shrink-0 border-t p-3">
            <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  // The complaint is about what was there a moment ago; keeping
                  // it on screen while the user fixes it just adds noise.
                  if (flow?.error) setFlow({ ...flow, error: undefined });
                }}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={placeholder}
                aria-label="Message the assistant"
                className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                size="icon"
                className="size-9 shrink-0 rounded-lg"
                aria-label={readyToRun ? "Run the action" : "Send message"}
                disabled={running || (!readyToRun && !currentArg && !draft.trim())}
                onClick={() => {
                  if (readyToRun) void runCommand();
                  else if (currentArg) submitText();
                  else sendFreeText();
                }}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[0.7rem] text-muted-foreground">
              {flow
                ? "Enter to continue · Backspace to go back · Esc to cancel"
                : "Type @ to create tasks, invite people and more"}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
