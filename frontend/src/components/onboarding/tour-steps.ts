export interface TourStep {
  /** Matches a `data-tour="…"` attribute; omit for a centered dialog. */
  target?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

/**
 * Steps whose target element is missing at runtime are skipped automatically,
 * so the same script works on mobile (no sidebar) and on empty boards.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Pyramid 👋",
    description:
      "A two-minute tour of where everything lives. You can skip now and replay it any time from the help menu.",
  },
  {
    target: "sidebar-nav",
    title: "Tasks and Projects",
    description:
      "Tasks is every card in your workspace. Projects groups related tasks — open one to see just its tasks.",
    placement: "right",
  },
  {
    target: "fields",
    title: "Switch views and columns",
    description:
      "Toggle between the Kanban board and a grouped list, and choose which fields — priority, members, due date, labels — appear on cards and rows.",
    placement: "bottom",
  },
  {
    target: "filter",
    title: "Narrow things down",
    description:
      "Filter by status, priority, member, label or reporter. The badge shows how many filters are active.",
    placement: "bottom",
  },
  {
    target: "search",
    title: "Find a task fast",
    description:
      "Search titles and descriptions. Press ⌘F (Ctrl+F on Windows) from anywhere to jump straight into it.",
    placement: "bottom",
  },
  {
    target: "add-task",
    title: "Create work",
    description:
      "Add a task with its status, priority, due date, members and labels. Each column also has its own + button.",
    placement: "bottom",
  },
  {
    target: "board",
    title: "Drag to update status",
    description:
      "Drag a card between columns to move it — the change saves instantly. Grab a column's handle to reorder columns, and open any card for subtasks, comments and activity.",
    placement: "top",
  },
  {
    target: "user-menu",
    title: "Make it yours",
    description:
      "Switch between light and dark, pick an accent color, edit your profile, or sign out — all from here.",
    placement: "right",
  },
  {
    target: "help",
    title: "That's the tour",
    description: "Replay it whenever you like from this menu. Happy shipping!",
    placement: "bottom",
  },
];
