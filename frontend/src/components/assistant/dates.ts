import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  isValid,
  nextDay,
  parse,
  startOfDay,
  type Day,
} from "date-fns";

/** The wire format the tasks API expects. */
export const API_DATE = "yyyy-MM-dd";

/** How a chosen date is read back to the user — long enough to be unambiguous. */
export function describeDate(date: Date): string {
  return format(date, "EEEE, d MMM yyyy");
}

const WEEKDAYS: Record<string, Day> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/** Formats tried in order; the first that parses cleanly wins. */
const FORMATS = [
  API_DATE,
  "d MMM yyyy",
  "d MMMM yyyy",
  "MMM d yyyy",
  "MMMM d yyyy",
  "d MMM",
  "d MMMM",
  "MMM d",
  "MMMM d",
  "d/M/yyyy",
  "d/M",
  "d-M-yyyy",
];

/**
 * Reads a date the way a person would write one: "tomorrow", "next friday",
 * "in 3 days", "25 Aug", "2026-09-01". Returns null rather than guessing when
 * nothing matches — the caller shows the parse back for confirmation, so a
 * wrong reading is always visible before anything is saved.
 *
 * Day-first is assumed for slashes (25/8), matching how the rest of the app
 * prints dates.
 */
export function parseDate(input: string, today = new Date()): Date | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return null;

  const base = startOfDay(today);

  if (text === "today" || text === "tod") return base;
  if (text === "tomorrow" || text === "tmr" || text === "tom") return addDays(base, 1);

  const inDays = /^in (\d+|a|an) (day|days|week|weeks|month|months)$/.exec(text);
  if (inDays) {
    const count = inDays[1] === "a" || inDays[1] === "an" ? 1 : Number(inDays[1]);
    const unit = inDays[2];
    if (unit.startsWith("day")) return addDays(base, count);
    if (unit.startsWith("week")) return addWeeks(base, count);
    return addMonths(base, count);
  }

  if (text === "next week") return addWeeks(base, 1);
  if (text === "next month") return addMonths(base, 1);
  if (text === "end of week" || text === "eow") return nextDay(base, 5);
  if (text === "end of month" || text === "eom") return endOfMonth(base);

  // "friday", "this friday", "next friday" and "on friday" all resolve to the
  // coming one. Splitting hairs between them would only produce dates the user
  // didn't mean, and the parse is shown back before anything is saved.
  const weekday = /^(?:(?:this|next|on) )?([a-z]+)$/.exec(text);
  if (weekday) {
    const day = WEEKDAYS[weekday[1]];
    if (day !== undefined) return nextDay(base, day);
  }

  for (const pattern of FORMATS) {
    const parsed = parse(text, pattern, base);
    if (!isValid(parsed)) continue;
    // Formats without a year default to the current one, which would put
    // "3 jan" in the past for most of the year. Roll it forward instead.
    if (!pattern.includes("yyyy") && parsed < base) return addMonths(parsed, 12);
    return startOfDay(parsed);
  }

  return null;
}

export interface DateShortcut {
  value: string;
  label: string;
  description: string;
}

/** The handful of dates people actually pick, offered without typing. */
export function dateShortcuts(today = new Date()): DateShortcut[] {
  const base = startOfDay(today);
  const entries: [string, Date][] = [
    ["Today", base],
    ["Tomorrow", addDays(base, 1)],
    ["This Friday", nextDay(base, 5)],
    ["Next week", addWeeks(base, 1)],
    ["In two weeks", addWeeks(base, 2)],
  ];

  const seen = new Set<string>();
  return entries.flatMap(([label, date]) => {
    const value = format(date, API_DATE);
    if (seen.has(value)) return [];
    seen.add(value);
    return [{ value, label, description: format(date, "EEE, d MMM") }];
  });
}
