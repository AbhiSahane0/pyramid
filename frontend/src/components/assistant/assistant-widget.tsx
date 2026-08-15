"use client";

import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  body: string;
}

/** Remembers that the launcher has been opened, so it stops asking for attention. */
const ENGAGED_KEY = "pyramid-assistant-engaged";

/** How often the idle launcher pulses, and for how long. */
const PULSE_EVERY_MS = 14_000;
const PULSE_FOR_MS = 2_600;

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  body: "Hi — I'm Pyramid's assistant. Ask me anything about your workspace: what's overdue, what a teammate is working on, or what to pick up next.",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const [thinking, setThinking] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [messages, thinking, open]);

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

  const send = () => {
    const body = draft.trim();
    if (!body || thinking) return;

    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", body }]);
    setDraft("");
    setThinking(true);

    // No agent behind this yet. Rather than inventing an answer, say so
    // plainly — a confident-sounding fake would be worse than nothing.
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          body: "I'm not connected to your workspace data yet — this is the chat surface, and the agent behind it is still being built. Once it's live I'll be able to answer this and act on it for you.",
        },
      ]);
      setThinking(false);
    }, 700);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Launcher. Stays mounted while the panel is open on desktop so the
          transition has something to anchor to, but hides on small screens
          where the panel covers it. */}
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
        {/* Attention ring — purely decorative, and never shown once engaged. */}
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
          // Escape handler, so the board stays usable while it's open. The X is
          // the only way out.
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
            "inset-x-3 bottom-3 top-16",
            "sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-5 sm:h-[min(34rem,calc(100svh-6rem))] sm:w-[24rem]",
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
                Preview — not connected yet
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
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted",
                  )}
                >
                  {message.body}
                </p>
              </div>
            ))}

            {thinking ? (
              <div className="flex justify-start" role="status" aria-label="Thinking">
                <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t p-3">
            <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends; Shift+Enter starts a new line.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask about your tasks…"
                aria-label="Message the assistant"
                className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                size="icon"
                className="size-9 shrink-0 rounded-lg"
                aria-label="Send message"
                disabled={!draft.trim() || thinking}
                onClick={send}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
