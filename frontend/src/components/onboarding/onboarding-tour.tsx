"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourStep } from "./tour-steps";
import { useTour } from "./use-tour";

const CARD_WIDTH = 330;
const GAP = 14;
const PADDING = 8;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function targetRect(step: TourStep | undefined): Rect | null {
  if (!step?.target) return null;
  const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
  if (!element) return null;
  const box = element.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return {
    top: box.top - PADDING,
    left: box.left - PADDING,
    width: box.width + PADDING * 2,
    height: box.height + PADDING * 2,
  };
}

const CENTERED = {
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
} as const;

/** Distance the card keeps from the viewport edges. */
const MARGIN = 12;

interface Size {
  width: number;
  height: number;
}

/**
 * Places the card beside the spotlight, preferring the step's placement and
 * falling back through the other sides. Both axes are clamped to the viewport,
 * and when no side can hold the card — a target as large as the board leaves
 * no room anywhere — it is centered instead. Without that fallback the card
 * could be pushed off-screen, stranding the user with no visible Next button.
 */
function cardPosition(
  rect: Rect | null,
  placement: TourStep["placement"],
  card: Size,
): CSSProperties {
  if (typeof window === "undefined" || !rect) return CENTERED;

  const { innerWidth: vw, innerHeight: vh } = window;
  const clampX = (x: number) =>
    Math.min(Math.max(x, MARGIN), Math.max(MARGIN, vw - card.width - MARGIN));
  const clampY = (y: number) =>
    Math.min(Math.max(y, MARGIN), Math.max(MARGIN, vh - card.height - MARGIN));

  const centerX = rect.left + rect.width / 2 - card.width / 2;
  const centerY = rect.top + rect.height / 2 - card.height / 2;

  const candidates = {
    bottom: { top: rect.top + rect.height + GAP, left: centerX },
    top: { top: rect.top - GAP - card.height, left: centerX },
    right: { top: centerY, left: rect.left + rect.width + GAP },
    left: { top: centerY, left: rect.left - GAP - card.width },
  } as const;

  // Try the requested side first, then the rest. A side qualifies when the
  // axis it controls has room; the other axis is clamped into view.
  const order = [placement ?? "bottom", "bottom", "top", "right", "left"] as const;
  for (const side of order) {
    const { top, left } = candidates[side];
    const hasRoom =
      side === "bottom"
        ? top + card.height <= vh - MARGIN
        : side === "top"
          ? top >= MARGIN
          : side === "right"
            ? left + card.width <= vw - MARGIN
            : left >= MARGIN;

    if (hasRoom) return { top: clampY(top), left: clampX(left) };
  }

  return CENTERED;
}

/**
 * Guided product tour. Highlights real UI with a spotlight cut-out and
 * explains each control; steps whose target is absent (e.g. the sidebar on
 * mobile) are skipped so the script adapts to the viewport.
 */
export function OnboardingTour() {
  const { isOpen, stop } = useTour();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  // Measured rather than assumed: the card grows with the step's copy, and a
  // wrong height is what pushes it off-screen.
  const [cardSize, setCardSize] = useState<Size>({ width: CARD_WIDTH, height: 190 });
  const mounted = useMounted();

  const measureCard = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const apply = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width === 0 && height === 0) return;
      setCardSize((current) =>
        Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
          ? current
          : { width, height },
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Which targets currently exist. Re-scanned while the tour is open so the
  // script adapts to the viewport (no sidebar on mobile) and to view changes
  // (no board in list view) instead of relying on one snapshot at open time.
  const [available, setAvailable] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    const scan = () => {
      const next: Record<string, boolean> = {};
      for (const candidate of TOUR_STEPS) {
        if (candidate.target) {
          next[candidate.target] =
            document.querySelector(`[data-tour="${candidate.target}"]`) !== null;
        }
      }
      // Reading the DOM is the whole point here; the equality guard means a
      // steady layout settles after one update rather than looping.
      setAvailable((previous) => {
        const unchanged =
          Object.keys(next).length === Object.keys(previous).length &&
          Object.entries(next).every(([key, value]) => previous[key] === value);
        return unchanged ? previous : next;
      });
    };
    scan();
    const interval = setInterval(scan, 500);
    window.addEventListener("resize", scan);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", scan);
    };
  }, [isOpen]);

  const steps = useMemo(
    () =>
      TOUR_STEPS.filter((candidate) => !candidate.target || available[candidate.target]),
    [available],
  );

  // Targets can disappear mid-tour (switching views), so keep the cursor valid.
  const safeIndex = Math.min(index, Math.max(0, steps.length - 1));
  const step = steps[safeIndex];
  const isLast = safeIndex === steps.length - 1;

  // Track the target through scrolling, resizing and layout shifts.
  useLayoutEffect(() => {
    if (!isOpen || !step) return;

    const element = step.target
      ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      : null;
    element?.scrollIntoView({ block: "nearest", inline: "nearest" });

    const measure = () => setRect(targetRect(step));
    measure();

    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    observer.observe(document.body);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen, step]);

  // Rewind on the way out so replaying from the help menu starts at step one
  // rather than resuming where the last run ended.
  const close = useCallback(() => {
    setIndex(0);
    stop();
  }, [stop]);

  const next = useCallback(() => {
    if (isLast) close();
    else setIndex((current) => current + 1);
  }, [isLast, close]);

  const back = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight" || event.key === "Enter") next();
      if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, next, back, close]);

  if (!mounted || !isOpen || !step) return null;

  const position = cardPosition(rect, step.placement, cardSize);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
      className="fixed inset-0 z-[100]"
    >
      {/* Dim everything, then punch a hole around the target. */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      ) : (
        // Explicit rgba (not a Tailwind oklab color) so the scrim matches the
        // spotlight's box-shadow exactly in every browser.
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        />
      )}

      {/* Click-off layer: anywhere outside the card ends the tour. */}
      <button
        type="button"
        aria-label="Skip tour"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={close}
      />

      <div
        ref={measureCard}
        className="absolute w-[330px] max-w-[calc(100vw-24px)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
        style={position}
      >
        <div className="mb-2 flex items-start gap-2.5">
          <Logo className="size-7 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{step.title}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-1 size-7 text-muted-foreground"
            aria-label="Skip tour"
            onClick={close}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{step.description}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i === safeIndex ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <span className="sr-only">
            Step {safeIndex + 1} of {steps.length}
          </span>
          <span className="flex-1" />
          {safeIndex > 0 ? (
            <Button variant="ghost" size="sm" onClick={back} className="gap-1">
              <ArrowLeft className="size-3.5" aria-hidden />
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={close}>
              Skip
            </Button>
          )}
          <Button size="sm" onClick={next} className="gap-1">
            {isLast ? "Finish" : "Next"}
            {isLast ? null : <ArrowRight className="size-3.5" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
